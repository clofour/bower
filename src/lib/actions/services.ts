'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { eq, and, desc } from 'drizzle-orm'
import { db } from '@/db'
import { services, serviceConfigs, deployments, environments } from '@/db/schema'
import { getCurrentUser } from '@/lib/auth'
import { getUserOrganization, getProjectBySlug } from '@/lib/queries'
import { getTrellisClient } from '@/lib/trellis-instance'
import { buildJobSpec } from '@/lib/job-builder'
import { recordAudit, requireService } from '@/lib/actions/shared'
import { requireProject } from '@/lib/actions/shared'
import { getDeploymentsByProject } from '@/lib/queries'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 63) || 'service'
}

export async function createServiceAction(
  projectSlug: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated.' }

  const ctx = await getUserOrganization(user.id)
  if (!ctx) return { error: 'No organization found.' }

  const project = await getProjectBySlug(ctx.org.id, projectSlug)
  if (!project) return { error: 'Project not found.' }
  const projectAccess = await (await import('@/lib/actions/shared')).requireProject(project.id)
  if (projectAccess.projectRole !== 'admin') return { error: 'Insufficient permissions.' }

  const name = formData.get('name')
  const type = formData.get('type')
  const image = formData.get('image')

  if (typeof name !== 'string' || !name.trim()) {
    return { error: 'Service name is required.' }
  }
  if (typeof type !== 'string' || !['web', 'worker', 'cron', 'custom'].includes(type)) {
    return { error: 'Invalid service type.' }
  }
  if (typeof image !== 'string' || !image.trim()) {
    return { error: 'Container image is required.' }
  }

  const slug = slugify(name.trim())

  const existing = await db
    .select()
    .from(services)
    .where(and(eq(services.projectId, project.id), eq(services.slug, slug)))
    .limit(1)

  if (existing.length > 0) {
    return { error: 'A service with this name already exists in this project.' }
  }

  const [svc] = await db
    .insert(services)
    .values({
      projectId: project.id,
      name: name.trim(),
      slug,
      type: type as 'web' | 'worker' | 'cron' | 'custom',
    })
    .returning({ id: services.id })

  const envs = await db
    .select()
    .from(environments)
    .where(eq(environments.projectId, project.id))

  if (envs.length > 0) {
    await db.insert(serviceConfigs).values(
      envs.map((env) => ({
        serviceId: svc.id,
        environmentId: env.id,
        image: image.trim(),
        port: type === 'web' ? 3000 : null,
        replicas: env.defaultReplicas,
        cpu: 250,
        memory: 268435456, // 256 MiB
        resourceTier: 'small' as const,
        deploymentStrategy: 'rolling' as const,
      })),
    )
  }

  await recordAudit({ orgId: ctx.org.id, userId: user.id, action: 'service.created',
    resourceType: 'service', resourceId: svc.id, details: { name: name.trim(), type } })

  redirect(`/projects/${projectSlug}`)
}

export async function deployServiceAction(
  serviceId: string,
  environmentId: string,
): Promise<void> {
  let access
  try { access = await requireService(serviceId) } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Not authorized.')
  }
  const { user, org, service: svc } = access
  if (access.projectRole === 'viewer') throw new Error('Insufficient permissions.')

  const configRows = await db
    .select()
    .from(serviceConfigs)
    .where(
      and(
        eq(serviceConfigs.serviceId, serviceId),
        eq(serviceConfigs.environmentId, environmentId),
      ),
    )
    .limit(1)
  if (configRows.length === 0) throw new Error('No configuration found for this environment.')

  const config = configRows[0]

  const [env] = await db.select().from(environments)
    .where(and(eq(environments.id, environmentId), eq(environments.projectId, svc.projectId))).limit(1)
  if (!env) throw new Error('Environment not found.')
  if (env.isLocked && access.projectRole !== 'admin') {
    throw new Error('This environment is locked. An administrator must deploy it.')
  }

  const [previous] = await db.select().from(deployments).where(and(
    eq(deployments.serviceId, serviceId), eq(deployments.environmentId, environmentId),
  )).orderBy(desc(deployments.createdAt)).limit(1)
  const [deployment] = await db.insert(deployments).values({
    serviceId,
    environmentId,
    imageAfter: config.image,
    imageBefore: previous?.imageAfter ?? null,
    strategy: config.deploymentStrategy,
    status: 'pending',
    triggeredByUserId: user.id,
    triggerType: 'manual',
  }).returning({ id: deployments.id })

  if (svc.type === 'cron') {
    await recordAudit({ orgId: org.id, userId: user.id, action: 'deployment.noop',
      resourceType: 'deployment', resourceId: deployment.id,
      details: { reason: 'Periodic jobs are not supported by Trellis yet.' } })
    revalidatePath(`/projects/${access.project.slug}`)
    throw new Error('Cron deployments are not yet available in Trellis.')
  }

  try {
    const spec = buildJobSpec({
      name: svc.slug, namespace: env.trellisNamespace, type: svc.type,
      image: config.image, port: config.port ?? undefined, replicas: config.replicas,
      cpu: config.cpu, memory: config.memory,
      healthCheckPath: config.healthCheckPath ?? undefined,
      healthCheckType: config.healthCheckType ?? undefined,
      deploymentStrategy: config.deploymentStrategy,
      envVars: (config.envVars ?? {}) as Record<string, string>,
      labels: (config.labels ?? {}) as Record<string, string>,
      command: config.command ?? undefined, secrets: [], sidecars: [],
    })
    const client = await getTrellisClient(org.id)
    const plan = await client.planJob(spec, env.trellisNamespace)
    await db.update(deployments).set({ status: 'deploying', planDiff: plan })
      .where(eq(deployments.id, deployment.id))
    await client.applyJob(spec, env.trellisNamespace)
    await recordAudit({ orgId: org.id, userId: user.id, action: 'service.deployed',
      resourceType: 'deployment', resourceId: deployment.id,
      details: { service: svc.slug, environment: env.slug, image: config.image } })
  } catch (error) {
    await db.update(deployments).set({ status: 'failed', completedAt: new Date() })
      .where(eq(deployments.id, deployment.id))
    throw new Error(error instanceof Error ? error.message : 'Deployment failed.')
  }

  revalidatePath(`/projects/${access.project.slug}`)

}

export async function promoteServiceAction(serviceId: string, sourceEnvironmentId: string, targetEnvironmentId: string) {
  const access = await requireService(serviceId)
  const [source] = await db.select().from(serviceConfigs).where(and(eq(serviceConfigs.serviceId, serviceId), eq(serviceConfigs.environmentId, sourceEnvironmentId))).limit(1)
  if (!source) throw new Error('Source configuration not found.')
  await db.update(serviceConfigs).set({ image: source.image, deploymentStrategy: source.deploymentStrategy, updatedAt: new Date() })
    .where(and(eq(serviceConfigs.serviceId, serviceId), eq(serviceConfigs.environmentId, targetEnvironmentId)))
  await recordAudit({ orgId: access.org.id, userId: access.user.id, action: 'service.promoted', resourceType: 'service', resourceId: serviceId, details: { sourceEnvironmentId, targetEnvironmentId, image: source.image } })
  await deployServiceAction(serviceId, targetEnvironmentId)
}

export async function rollbackServiceAction(serviceId: string, environmentId: string) {
  const access = await requireService(serviceId)
  const history = await db.select().from(deployments).where(and(eq(deployments.serviceId, serviceId), eq(deployments.environmentId, environmentId))).orderBy(desc(deployments.createdAt)).limit(2)
  const image = history[0]?.imageBefore ?? history[1]?.imageAfter
  if (!image) throw new Error('No previous deployment is available.')
  await db.update(serviceConfigs).set({ image, updatedAt: new Date() }).where(and(eq(serviceConfigs.serviceId, serviceId), eq(serviceConfigs.environmentId, environmentId)))
  await recordAudit({ orgId: access.org.id, userId: access.user.id, action: 'service.rollback.requested', resourceType: 'service', resourceId: serviceId, details: { environmentId, image } })
  await deployServiceAction(serviceId, environmentId)
}

export async function refreshDeploymentStatusesAction(projectId: string) {
  const access = await requireProject(projectId)
  const active = (await getDeploymentsByProject(projectId, 50)).filter((row) => row.deployment.status === 'pending' || row.deployment.status === 'planning' || row.deployment.status === 'deploying')
  if (!active.length || !access.org.trellisApiUrl || !access.org.trellisApiToken) return
  const client = await getTrellisClient(access.org.id)
  await Promise.all(active.map(async ({ deployment, serviceSlug }) => {
    const [environment] = await db.select().from(environments).where(eq(environments.id, deployment.environmentId)).limit(1)
    if (!environment) return
    try {
      const allocations = await client.listAllocations({ namespace: environment.trellisNamespace, job: serviceSlug })
      if (allocations.some((allocation) => allocation.phase === 'failed' || allocation.phase === 'lost')) {
        await db.update(deployments).set({ status: 'failed', completedAt: new Date() }).where(eq(deployments.id, deployment.id))
      } else if (allocations.length > 0 && allocations.every((allocation) => allocation.phase === 'running' && allocation.health === 'healthy')) {
        await db.update(deployments).set({ status: 'healthy', completedAt: new Date(), trellisRevision: Math.max(...allocations.map((allocation) => allocation.job_revision)) }).where(eq(deployments.id, deployment.id))
      }
    } catch { /* keep the last known state while Trellis is unreachable */ }
  }))
  revalidatePath(`/projects/${access.project.slug}/deployments`)
}

export async function updateServiceConfigAction(serviceId: string, environmentId: string, formData: FormData) {
  let access
  try { access = await requireService(serviceId) } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Not authorized.')
  }
  if (access.projectRole !== 'admin') throw new Error('Insufficient permissions.')
  const image = String(formData.get('image') ?? '').trim()
  const replicas = Number(formData.get('replicas'))
  const portValue = String(formData.get('port') ?? '').trim()
  if (!image) throw new Error('Image is required.')
  if (!Number.isInteger(replicas) || replicas < 0) throw new Error('Replicas must be zero or greater.')
  const envVarsText = String(formData.get('envVars') ?? '').trim()
  const envVars: Record<string, string> = {}
  for (const line of envVarsText.split('\n').filter(Boolean)) {
    const split = line.indexOf('=')
    if (split < 1) throw new Error(`Invalid environment variable: ${line}`)
    envVars[line.slice(0, split).trim()] = line.slice(split + 1).trim()
  }
  await db.update(serviceConfigs).set({
    image, replicas, port: portValue ? Number(portValue) : null,
    deploymentStrategy: String(formData.get('strategy')) as 'rolling' | 'recreate' | 'blue_green' | 'canary',
    healthCheckPath: String(formData.get('healthPath') ?? '').trim() || null,
    envVars, updatedAt: new Date(),
  }).where(and(eq(serviceConfigs.serviceId, serviceId), eq(serviceConfigs.environmentId, environmentId)))
  await recordAudit({ orgId: access.org.id, userId: access.user.id, action: 'service.config.updated',
    resourceType: 'service', resourceId: serviceId, details: { environmentId } })
  revalidatePath(`/projects/${access.project.slug}/services/${access.service.slug}`)
}

export async function scaleServiceAction(serviceId: string, environmentId: string, replicas: number) {
  const access = await requireService(serviceId)
  if (!Number.isInteger(replicas) || replicas < 0) throw new Error('Invalid replica count.')
  await db.update(serviceConfigs).set({ replicas, updatedAt: new Date() })
    .where(and(eq(serviceConfigs.serviceId, serviceId), eq(serviceConfigs.environmentId, environmentId)))
  await recordAudit({ orgId: access.org.id, userId: access.user.id,
    action: replicas === 0 ? 'service.paused' : 'service.scaled', resourceType: 'service',
    resourceId: serviceId, details: { environmentId, replicas } })
  await deployServiceAction(serviceId, environmentId)
}

export async function deleteServiceAction(
  serviceId: string,
  projectSlug: string,
): Promise<{ error?: string }> {
  const access = await requireService(serviceId)
  if (access.projectRole !== 'admin') return { error: 'Insufficient permissions.' }
  await db.delete(services).where(eq(services.id, serviceId))
  await recordAudit({ orgId: access.org.id, userId: access.user.id, action: 'service.deleted', resourceType: 'service', resourceId: serviceId })

  redirect(`/projects/${projectSlug}`)
}
