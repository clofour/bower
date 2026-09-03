import { createHash } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { environments, managedProxies, projects, routes, services, serviceConfigs } from '@/db/schema'
import { getTrellisClient } from '@/lib/trellis-instance'
import type { TrellisJobSpec } from '@/types/trellis'

function quote(value: string) {
  return JSON.stringify(value)
}

export async function syncManagedProxy(projectId: string, environmentId: string, orgId: string) {
  const [environment] = await db.select().from(environments).where(and(eq(environments.id, environmentId), eq(environments.projectId, projectId))).limit(1)
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1)
  if (!environment || !project) throw new Error('Proxy environment was not found.')

  const definitions = await db.select({ route: routes, service: services, config: serviceConfigs })
    .from(routes)
    .innerJoin(services, eq(services.id, routes.serviceId))
    .innerJoin(serviceConfigs, and(eq(serviceConfigs.serviceId, services.id), eq(serviceConfigs.environmentId, environmentId)))
    .where(and(eq(routes.projectId, projectId), eq(routes.environmentId, environmentId)))
  const client = await getTrellisClient(orgId)
  if (definitions.length === 0) {
    await client.deleteJob('canopy-proxy', environment.trellisNamespace).catch(() => undefined)
    await client.deleteSecret(environment.trellisNamespace, 'CANOPY_CADDYFILE').catch(() => undefined)
    await db.delete(managedProxies).where(eq(managedProxies.environmentId, environmentId))
    return
  }
  const blocks: string[] = []
  const controllerRoutes: Array<Record<string, unknown>> = []

  for (const definition of definitions) {
    const job = definition.config.activeJobName || definition.service.slug
    let upstreams: string[] = []
    try {
      const allocations = await client.listAllocations({ namespace: environment.trellisNamespace, job })
      upstreams = allocations
        .filter((allocation) => allocation.phase === 'running' && allocation.health !== 'unhealthy')
        .map((allocation) => {
          const published = allocation.ports.find((port) => port.port === definition.route.port)
          return `${allocation.address || '127.0.0.1'}:${published?.host_port || definition.route.port}`
        })
    } catch { /* an empty upstream set renders a safe 503 route */ }

    const requestHeaders = definition.route.headers as Record<string, string>
    const responseHeaders = definition.route.responseHeaders as Record<string, string>
    const redirects = definition.route.redirects as Array<{ from: string; to: string; code?: number }>
    controllerRoutes.push({ domain: definition.route.domain, pathPrefix: definition.route.pathPrefix, port: definition.route.port, tlsMode: definition.route.tlsMode, tlsCertSecret: definition.route.tlsCertSecret, tlsKeySecret: definition.route.tlsKeySecret, requestHeaders, responseHeaders, redirects, rateLimit: definition.route.rateLimit, service: definition.service.slug, activeJob: definition.config.activeJobName || definition.service.slug, strategy: definition.config.deploymentStrategy })
    const lines = [`${definition.route.domain} {`]
    if (definition.route.tlsMode === 'none') lines[0] = `http://${definition.route.domain} {`
    if (definition.route.tlsMode === 'custom' && definition.route.tlsCertSecret && definition.route.tlsKeySecret) {
      lines.push(`  tls /run/trellis-secrets/${definition.route.tlsCertSecret} /run/trellis-secrets/${definition.route.tlsKeySecret}`)
    }
    for (const redirect of redirects) lines.push(`  redir ${redirect.from} ${redirect.to} ${redirect.code || 308}`)
    const matcher = definition.route.pathPrefix === '/' ? '' : `${definition.route.pathPrefix}*`
    if (upstreams.length === 0) {
      lines.push(`  respond ${matcher} "No healthy upstream allocations" 503`)
    } else {
      lines.push(`  reverse_proxy ${matcher} ${upstreams.join(' ')} {`)
      for (const [name, value] of Object.entries(requestHeaders)) lines.push(`    header_up ${name} ${quote(value)}`)
      for (const [name, value] of Object.entries(responseHeaders)) lines.push(`    header_down ${name} ${quote(value)}`)
      lines.push('  }')
    }
    if (definition.route.rateLimit) {
      lines.push(`  rate_limit { zone canopy { key {remote_host} events ${definition.route.rateLimit} window 1s } }`)
    }
    lines.push('}')
    blocks.push(lines.join('\n'))
  }

  const adminPort = 20_000 + (parseInt(createHash('sha256').update(environment.id).digest('hex').slice(0, 4), 16) % 10_000)
  const caddyfile = `{\n  admin 0.0.0.0:${adminPort}\n  order rate_limit before basic_auth\n}\n\n:80 { respond "Canopy proxy is discovering routes" 200 }`
  const hash = createHash('sha256').update(JSON.stringify(controllerRoutes)).digest('hex')
  const secretName = 'CANOPY_CADDYFILE'
  await client.setSecret(environment.trellisNamespace, secretName, caddyfile)

  const customTls = definitions.flatMap(({ route }) => route.tlsMode === 'custom' && route.tlsCertSecret && route.tlsKeySecret
    ? [{ name: route.tlsCertSecret, target: 'file' as const, path: `/run/trellis-secrets/${route.tlsCertSecret}` }, { name: route.tlsKeySecret, target: 'file' as const, path: `/run/trellis-secrets/${route.tlsKeySecret}` }]
    : [])
  const spec: TrellisJobSpec = {
    name: 'canopy-proxy',
    namespace: environment.trellisNamespace,
    task_groups: [{
      name: 'proxy', count: 1, api_access: { scope: 'namespace', access: 'read' },
      labels: { 'canopy/managed': 'true', 'canopy/infrastructure': 'proxy' },
      update: { strategy: 'rolling', max_parallel: 1 },
      tasks: [{
        name: 'caddy', image: process.env.CANOPY_CADDY_IMAGE || 'ghcr.io/clofour/canopy-caddy:latest',
        resources: { cpu: 100, memory: 134217728 },
        networking: { mode: 'host', ports: [{ port: 80 }, { port: 443 }, { port: adminPort }] },
        secrets: [{ name: secretName, target: 'file', path: '/run/trellis-secrets/CANOPY_CADDYFILE' }, ...customTls],
        health_check: { type: 'tcp', port: 80, interval: 10_000_000_000, timeout: 2_000_000_000, threshold: 3 },
      }, {
        name: 'route-sync', image: process.env.CANOPY_PROXY_SYNC_IMAGE || 'ghcr.io/clofour/canopy-proxy-sync:latest',
        resources: { cpu: 50, memory: 67108864 }, networking: { mode: 'host' },
        env: { CANOPY_ROUTES: JSON.stringify(controllerRoutes), CADDY_ADMIN_URL: `http://127.0.0.1:${adminPort}/load`, CADDY_ADMIN_PORT: String(adminPort), CANOPY_SYNC_INTERVAL: '5' },
      }],
    }],
  }

  await db.insert(managedProxies).values({ environmentId, trellisJobName: spec.name, status: 'pending', port: 80, configHash: hash })
    .onConflictDoUpdate({ target: managedProxies.environmentId, set: { status: 'pending', configHash: hash, updatedAt: new Date() } })
  try {
    await client.applyJob(spec, environment.trellisNamespace)
    await db.update(managedProxies).set({ status: 'running', updatedAt: new Date() }).where(eq(managedProxies.environmentId, environmentId))
  } catch (error) {
    await db.update(managedProxies).set({ status: 'error', updatedAt: new Date() }).where(eq(managedProxies.environmentId, environmentId))
    throw error
  }
}
