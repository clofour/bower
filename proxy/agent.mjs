import process from 'node:process'

const routes = JSON.parse(process.env.CANOPY_ROUTES || '[]')
const trellis = (process.env.TRELLIS_ADDR || '').replace(/\/$/, '')
const token = process.env.TRELLIS_TOKEN || ''
const namespace = process.env.TRELLIS_NAMESPACE || ''
const caddy = process.env.CADDY_ADMIN_URL || 'http://127.0.0.1:2019/load'
const adminPort = process.env.CADDY_ADMIN_PORT || '2019'
const interval = Math.max(1, Number(process.env.CANOPY_SYNC_INTERVAL || 5)) * 1000
if (!trellis || !token || !namespace) throw new Error('Trellis api_access variables are required.')

let last = ''
const q = (value) => JSON.stringify(String(value))
const jobFor = (route, allocation) => route.strategy === 'canary'
  ? allocation.labels?.['canopy/service'] === route.service
  : allocation.job === route.activeJob

async function reconcile() {
  const response = await fetch(`${trellis}/v1/allocations`, { headers: { authorization: `Bearer ${token}`, 'x-trellis-namespace': namespace } })
  if (!response.ok) throw new Error(`Trellis returned ${response.status}.`)
  const allocations = await response.json()
  const rendered = routes.map((route) => {
    const upstreams = allocations.filter((allocation) => allocation.phase === 'running' && allocation.health === 'healthy' && jobFor(route, allocation)).flatMap((allocation) => {
      const port = allocation.ports?.find((item) => item.port === route.port)?.host_port || route.port
      const upstream = `${allocation.address}:${port}`
      const weight = Math.max(1, Number(allocation.labels?.['trellis/weight'] || 100))
      return Array.from({ length: Math.min(100, weight) }, () => upstream)
    })
    const lines = []
    for (const rule of route.redirects || []) lines.push(`    redir ${rule.from} ${rule.to} ${rule.code || 308}`)
    if (!upstreams.length) lines.push('    respond "No healthy upstream allocations" 503')
    else {
      lines.push(`    reverse_proxy ${upstreams.join(' ')} {`)
      for (const [name, value] of Object.entries(route.requestHeaders || {})) lines.push(`      header_up ${name} ${q(value)}`)
      for (const [name, value] of Object.entries(route.responseHeaders || {})) lines.push(`      header_down ${name} ${q(value)}`)
      lines.push('    }')
    }
    if (route.rateLimit) lines.unshift(`    rate_limit { zone route_${Buffer.from(`${route.domain}${route.pathPrefix}`).toString('hex').slice(0, 20)} { key {remote_host} events ${route.rateLimit} window 1s } }`)
    return { ...route, lines }
  })
  const groups = new Map()
  for (const route of rendered) {
    const key = `${route.tlsMode === 'none' ? 'http://' : ''}${route.domain}`
    if (!groups.has(key)) groups.set(key, { route, handlers: [] })
    groups.get(key).handlers.push(route)
  }
  const blocks = [...groups.entries()].map(([address, group]) => {
    const lines = [`${address} {`]
    if (group.route.tlsMode === 'custom' && group.route.tlsCertSecret && group.route.tlsKeySecret) lines.push(`  tls /run/trellis-secrets/${group.route.tlsCertSecret} /run/trellis-secrets/${group.route.tlsKeySecret}`)
    for (const route of group.handlers.sort((a, b) => b.pathPrefix.length - a.pathPrefix.length)) {
      lines.push(route.pathPrefix === '/' ? '  handle {' : `  handle ${route.pathPrefix}* {`, ...route.lines, '  }')
    }
    lines.push('}'); return lines.join('\n')
  })
  const config = `{\n  admin 0.0.0.0:${adminPort}\n  order rate_limit before basic_auth\n}\n\n${blocks.length ? blocks.join('\n\n') : ':80 { respond "Canopy proxy ready" 200 }'}`
  if (config === last) return
  const loaded = await fetch(caddy, { method: 'POST', headers: { 'content-type': 'text/caddyfile' }, body: config })
  if (!loaded.ok) throw new Error(`Caddy reload returned ${loaded.status}: ${await loaded.text()}`)
  last = config
  console.log(`loaded ${routes.length} routes with ${allocations.length} allocations`)
}

for (;;) {
  try { await reconcile() } catch (error) { console.error(error) }
  await new Promise((resolve) => setTimeout(resolve, interval))
}
