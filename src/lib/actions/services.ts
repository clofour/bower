'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { deploymentEvents, deployments, environments, projects, secretsMetadata, serviceConfigs, services, sidecars, users } from '@/db/schema'
import { getCurrentUser } from '@/lib/auth'
import { getDeploymentsByProject, getProjectBySlug, getUserOrganization } from '@/lib/queries'
import { getTrellisClient } from '@/lib/trellis-instance'
import { buildJobSpec, type CanopySecretBinding, type CanopySidecar } from '@/lib/job-builder'
import { recordAudit, requireProject, requireService } from '@/lib/actions/shared'
import { sendDeploymentNotifications } from '@/lib/notifications'
import { syncManagedProxy } from '@/lib/managed-proxy'
import type { TrellisJobSpec, TrellisVolume } from '@/types/trellis'

type Trigger = 'manual' | 'webhook' | 'promotion' | 'rollback' | 'auto_rollback'
const RESOURCE_TIERS = { small: [100, 134217728], medium: [250, 268435456], large: [500, 536870912], xl: [1000, 1073741824] } as const

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 63) || 'service'
}

function linesToRecord(value: string) {
  const result: Record<string, string> = {}
  for (const line of value.split('\n').map((item) => item.trim()).filter(Boolean)) {
    const split = line.indexOf('=')
    if (split < 1) throw new Error(`Invalid key/value line: ${line}`)
    result[line.slice(0, split).trim()] = line.slice(split + 1).trim()
  }
  return result
}

function jsonField<T>(formData: FormData, key: string, fallback: T): T {
  const value = String(formData.get(key) ?? '').trim()
  if (!value) return fallback
  try { return JSON.parse(value) as T } catch { throw new Error(`${key} must contain valid JSON.`) }
}

async function createSpec(serviceId: string, environmentId: string, jobName?: string, overrides?: { replicas?: number; labels?: Record<string, string> }) {
  const [row] = await db.select({ config: serviceConfigs, service: services, environment: environments, project: projects })
    .from(serviceConfigs)
    .innerJoin(services, eq(services.id, serviceConfigs.serviceId))
    .innerJoin(environments, eq(environments.id, serviceConfigs.environmentId))
    .innerJoin(projects, eq(projects.id, services.projectId))
    .where(and(eq(serviceConfigs.serviceId, serviceId), eq(serviceConfigs.environmentId, environmentId))).limit(1)
  if (!row) throw new Error('Service configuration was not found.')
  const attached = await db.select().from(sidecars).where(eq(sidecars.serviceConfigId, row.config.id))
  const spec = buildJobSpec({
    name: jobName || row.service.slug, serviceLabel: row.service.slug, namespace: row.environment.trellisNamespace, type: row.service.type,
    image: row.config.image, port: row.config.port ?? undefined, replicas: overrides?.replicas ?? row.config.replicas,
    cpu: row.config.cpu, memory: row.config.memory, healthCheckPath: row.config.healthCheckPath ?? undefined,
    healthCheckType: row.config.healthCheckType ?? undefined, healthCheckCommand: row.config.healthCheckCommand as string[],
    healthCheckInterval: row.config.healthCheckInterval, healthCheckTimeout: row.config.healthCheckTimeout,
    healthCheckThreshold: row.config.healthCheckThreshold, deploymentStrategy: row.config.deploymentStrategy,
    envVars: row.config.envVars as Record<string, string>,
    labels: { ...(row.config.labels as Record<string, string>), ...overrides?.labels }, command: row.config.command ?? undefined,
    secrets: [...Object.entries(row.environment.envVars as Record<string, string>).map(([env, name]) => ({ name, target: 'env' as const, env })), ...(row.config.secretBindings as CanopySecretBinding[])], volumes: row.config.volumes as TrellisVolume[],
    sidecars: attached.map((item) => ({ name: item.name, image: item.image, cpu: item.cpu, memory: item.memory, port: item.port ?? undefined, envVars: item.envVars as Record<string, string>, command: item.command ?? undefined })) as CanopySidecar[],
    rawConfig: row.config.rawConfig as TrellisJobSpec | undefined,
  })
  return { ...row, spec }
}

async function event(deploymentId: string, type: string, message: string, details: Record<string, unknown> = {}) {
  await db.insert(deploymentEvents).values({ deploymentId, type, message, details })
}

async function notify(row: Awaited<ReturnType<typeof createSpec>>, status: string, userId?: string | null) {
  const [user] = userId ? await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, userId)).limit(1) : []
  await sendDeploymentNotifications(row.project.id, { service: row.service.name, environment: row.environment.name, image: row.config.image, status, user: user?.name || user?.email || 'automation', timestamp: new Date().toISOString() })
}

async function executeDeployment(serviceId: string, environmentId: string, triggerType: Trigger, userId?: string | null) {
  const row = await createSpec(serviceId, environmentId)
  if (row.service.type === 'cron') throw new Error('Cron deployments are not yet available in Trellis.')
  if (row.environment.isLocked && triggerType === 'webhook') throw new Error('This environment is locked and requires an administrator.')
  const [previous] = await db.select().from(deployments).where(and(eq(deployments.serviceId, serviceId), eq(deployments.environmentId, environmentId), eq(deployments.status, 'healthy'))).orderBy(desc(deployments.createdAt)).limit(1)
  let jobName = row.service.slug
  let spec = row.spec
  if (row.config.deploymentStrategy === 'blue_green') {
    const active = row.config.activeJobName || row.service.slug
    jobName = active.endsWith('-blue') ? `${row.service.slug}-green` : `${row.service.slug}-blue`
    spec = (await createSpec(serviceId, environmentId, jobName)).spec
  } else if (row.config.deploymentStrategy === 'canary') {
    const active = row.config.activeJobName || row.service.slug
    jobName = active.endsWith('-canary-a') ? `${row.service.slug}-canary-b` : `${row.service.slug}-canary-a`
    spec = (await createSpec(serviceId, environmentId, jobName, { replicas: 1, labels: { 'trellis/weight': '10', 'canopy/canary': 'true' } })).spec
  }
  const [deployment] = await db.insert(deployments).values({
    serviceId, environmentId, imageAfter: row.config.image, imageBefore: previous?.imageAfter ?? null,
    strategy: row.config.deploymentStrategy, status: 'planning', triggeredByUserId: userId ?? null,
    triggerType, jobSpec: spec, previousJobSpec: previous?.jobSpec ?? null, trellisJobName: jobName,
  }).returning()
  await event(deployment.id, 'planning', 'Generated Trellis JobSpec and requested a semantic plan.')
  try {
    const client = await getTrellisClient(row.project.orgId)
    const plan = await client.planJob(spec, row.environment.trellisNamespace)
    await db.update(deployments).set({ status: 'deploying', planDiff: plan }).where(eq(deployments.id, deployment.id))
    await event(deployment.id, 'deploying', `Applying ${jobName}.`, { plan })
    const result = await client.applyJob(spec, row.environment.trellisNamespace)
    if (result?.revision) await db.update(deployments).set({ trellisRevision: result.revision }).where(eq(deployments.id, deployment.id))
    await recordAudit({ orgId: row.project.orgId, userId: userId ?? null, action: `deployment.${triggerType}`, resourceType: 'deployment', resourceId: deployment.id, details: { serviceId, environmentId, image: row.config.image, strategy: row.config.deploymentStrategy } })
    await notify(row, 'deploying', userId)
  } catch (error) {
    await db.update(deployments).set({ status: 'failed', completedAt: new Date() }).where(eq(deployments.id, deployment.id))
    await event(deployment.id, 'failed', error instanceof Error ? error.message : 'Deployment failed.')
    await notify(row, 'failed', userId)
    throw error
  }
  return { deployment, row }
}

export async function createServiceAction(projectSlug: string, formData: FormData): Promise<{ error?: string }> {
  const user = await getCurrentUser(); if (!user) return { error: 'Not authenticated.' }
  const ctx = await getUserOrganization(user.id); if (!ctx) return { error: 'No organization found.' }
  const project = await getProjectBySlug(ctx.org.id, projectSlug); if (!project) return { error: 'Project not found.' }
  const access = await requireProject(project.id); if (access.projectRole !== 'admin') return { error: 'Insufficient permissions.' }
  const name = String(formData.get('name') ?? '').trim(); const type = String(formData.get('type') ?? '') as 'web' | 'worker' | 'cron' | 'custom'; const image = String(formData.get('image') ?? '').trim()
  if (!name || !image || !['web', 'worker', 'cron', 'custom'].includes(type)) return { error: 'Name, type, and image are required.' }
  const slug = slugify(name); const [duplicate] = await db.select().from(services).where(and(eq(services.projectId, project.id), eq(services.slug, slug))).limit(1)
  if (duplicate) return { error: 'A service with this name already exists.' }
  const template = jsonField<Record<string, unknown>>(formData, 'templateConfig', {})
  const [service] = await db.insert(services).values({ projectId: project.id, name, slug, type }).returning()
  const envs = await db.select().from(environments).where(eq(environments.projectId, project.id))
  const createdConfigs = envs.length ? await db.insert(serviceConfigs).values(envs.map((env) => ({
    serviceId: service.id, environmentId: env.id, image, port: Number(template.port ?? (type === 'web' ? 8080 : 0)) || null,
    replicas: Number(template.replicas ?? (type === 'web' ? 2 : env.defaultReplicas)), cpu: Number(template.cpu ?? (env.resourceTier === 'custom' ? 100 : RESOURCE_TIERS[env.resourceTier][0])), memory: Number(template.memory ?? (env.resourceTier === 'custom' ? 134217728 : RESOURCE_TIERS[env.resourceTier][1])),
    resourceTier: (template.resourceTier ?? env.resourceTier) as 'small' | 'medium' | 'large' | 'xl' | 'custom',
    deploymentStrategy: (template.deploymentStrategy ?? 'rolling') as 'rolling' | 'recreate' | 'blue_green' | 'canary',
    healthCheckType: (template.healthCheckType ?? (type === 'web' ? 'http' : undefined)) as 'http' | 'tcp' | 'script' | undefined,
    healthCheckPath: type === 'web' ? String(template.healthCheckPath ?? '/health') : (typeof template.healthCheckPath === 'string' ? template.healthCheckPath : null),
    healthCheckCommand: (template.healthCheckCommand ?? []) as string[], healthCheckInterval: Number(template.healthCheckInterval ?? 10), healthCheckTimeout: Number(template.healthCheckTimeout ?? 2), healthCheckThreshold: Number(template.healthCheckThreshold ?? 3),
    envVars: (template.envVars ?? {}) as Record<string, string>, labels: (template.labels ?? {}) as Record<string, string>, command: typeof template.command === 'string' ? template.command : null,
    volumes: (template.volumes ?? []) as TrellisVolume[], secretBindings: (template.secretBindings ?? []) as CanopySecretBinding[], rawConfig: template.rawConfig as TrellisJobSpec | undefined,
    cronSchedule: typeof template.cronSchedule === 'string' ? template.cronSchedule : null, autoRollbackSeconds: Number(template.autoRollbackSeconds ?? 300), canarySteps: (template.canarySteps ?? [10, 25, 50, 100]) as number[],
  }))).returning() : []
  const templateSidecars = Array.isArray(template.sidecars) ? template.sidecars as Array<{ name: string; image: string; cpu?: number; memory?: number; port?: number; envVars?: Record<string, string>; command?: string }> : []
  if (createdConfigs.length && templateSidecars.length) await db.insert(sidecars).values(createdConfigs.flatMap((config) => templateSidecars.map((item) => ({ serviceConfigId: config.id, name: item.name, image: item.image, cpu: item.cpu ?? 100, memory: item.memory ?? 67108864, port: item.port ?? null, envVars: item.envVars ?? {}, command: item.command ?? null }))))
  await recordAudit({ orgId: ctx.org.id, userId: user.id, action: 'service.created', resourceType: 'service', resourceId: service.id, details: { before: null, after: { name, type, image } } })
  redirect(`/projects/${projectSlug}/services/${slug}`)
}

export async function deployServiceAction(serviceId: string, environmentId: string) {
  const access = await requireService(serviceId); if (access.projectRole === 'viewer') throw new Error('Insufficient permissions.')
  const [env] = await db.select().from(environments).where(eq(environments.id, environmentId)).limit(1)
  if (env?.isLocked && access.projectRole !== 'admin') throw new Error('This environment is locked. An administrator must deploy it.')
  const { deployment } = await executeDeployment(serviceId, environmentId, 'manual', access.user.id)
  await recordAudit({ orgId: access.org.id, userId: access.user.id, action: 'service.deployed', resourceType: 'deployment', resourceId: deployment.id, details: { serviceId, environmentId } })
  revalidatePath(`/projects/${access.project.slug}`)
}

export async function deployServiceFromAutomation(serviceId: string, environmentId: string, image: string, trigger: 'webhook' | 'manual', userId?: string | null) {
  const [row] = await db.select({ environment: environments }).from(serviceConfigs).innerJoin(environments, eq(environments.id, serviceConfigs.environmentId)).where(and(eq(serviceConfigs.serviceId, serviceId), eq(serviceConfigs.environmentId, environmentId))).limit(1)
  if (!row) throw new Error('Service environment not found.')
  if (trigger === 'webhook' && row.environment.isLocked) throw new Error('This environment is locked and requires an administrator.')
  await db.update(serviceConfigs).set({ image, updatedAt: new Date() }).where(and(eq(serviceConfigs.serviceId, serviceId), eq(serviceConfigs.environmentId, environmentId)))
  return executeDeployment(serviceId, environmentId, trigger, userId)
}

export async function promoteServiceAction(serviceId: string, sourceEnvironmentId: string, targetEnvironmentId: string) {
  const access = await requireService(serviceId); if (access.projectRole === 'viewer') throw new Error('Insufficient permissions.')
  const [source] = await db.select().from(serviceConfigs).where(and(eq(serviceConfigs.serviceId, serviceId), eq(serviceConfigs.environmentId, sourceEnvironmentId))).limit(1)
  const [target] = await db.select().from(serviceConfigs).where(and(eq(serviceConfigs.serviceId, serviceId), eq(serviceConfigs.environmentId, targetEnvironmentId))).limit(1)
  if (!source || !target) throw new Error('Promotion environments were not found.')
  await db.update(serviceConfigs).set({ image: source.image, port: source.port, cpu: source.cpu, memory: source.memory, healthCheckPath: source.healthCheckPath, healthCheckType: source.healthCheckType, healthCheckCommand: source.healthCheckCommand, healthCheckInterval: source.healthCheckInterval, healthCheckTimeout: source.healthCheckTimeout, healthCheckThreshold: source.healthCheckThreshold, deploymentStrategy: source.deploymentStrategy, resourceTier: source.resourceTier, labels: source.labels, command: source.command, volumes: source.volumes, rawConfig: source.rawConfig, cronSchedule: source.cronSchedule, canarySteps: source.canarySteps, updatedAt: new Date() }).where(eq(serviceConfigs.id, target.id))
  const sourceSidecars = await db.select().from(sidecars).where(eq(sidecars.serviceConfigId, source.id)); await db.delete(sidecars).where(eq(sidecars.serviceConfigId, target.id))
  if (sourceSidecars.length) await db.insert(sidecars).values(sourceSidecars.map((sidecar) => ({ serviceConfigId: target.id, name: sidecar.name, image: sidecar.image, cpu: sidecar.cpu, memory: sidecar.memory, port: sidecar.port, envVars: sidecar.envVars, command: sidecar.command })))
  const { deployment } = await executeDeployment(serviceId, targetEnvironmentId, 'promotion', access.user.id)
  await recordAudit({ orgId: access.org.id, userId: access.user.id, action: 'service.promoted', resourceType: 'deployment', resourceId: deployment.id, details: { sourceEnvironmentId, targetEnvironmentId, image: source.image } })
}

export async function rollbackServiceAction(serviceId: string, environmentId: string) {
  const access = await requireService(serviceId); if (access.projectRole === 'viewer') throw new Error('Insufficient permissions.')
  const [last] = await db.select().from(deployments).where(and(eq(deployments.serviceId, serviceId), eq(deployments.environmentId, environmentId))).orderBy(desc(deployments.createdAt)).limit(1)
  if (!last?.previousJobSpec) throw new Error('No stored previous JobSpec is available.')
  const spec = last.previousJobSpec as TrellisJobSpec; const [config] = await db.select().from(serviceConfigs).where(and(eq(serviceConfigs.serviceId, serviceId), eq(serviceConfigs.environmentId, environmentId))).limit(1)
  if (!config) throw new Error('Configuration not found.')
  const image = spec.task_groups[0]?.tasks[0]?.image
  if (image) await db.update(serviceConfigs).set({ image, updatedAt: new Date() }).where(eq(serviceConfigs.id, config.id))
  const client = await getTrellisClient(access.org.id); const plan = await client.planJob(spec, spec.namespace)
  const [deployment] = await db.insert(deployments).values({ serviceId, environmentId, imageBefore: config.image, imageAfter: image || config.image, strategy: config.deploymentStrategy, status: 'deploying', triggeredByUserId: access.user.id, triggerType: 'rollback', planDiff: plan, jobSpec: spec, previousJobSpec: last.jobSpec, trellisJobName: spec.name }).returning()
  await client.applyJob(spec, spec.namespace); await event(deployment.id, 'rollback', 'Re-applied the exact previous JobSpec.')
  await notify(await createSpec(serviceId, environmentId), 'deploying', access.user.id)
  await recordAudit({ orgId: access.org.id, userId: access.user.id, action: 'service.rollback.requested', resourceType: 'deployment', resourceId: deployment.id, details: { environmentId } })
}

export async function refreshDeploymentStatusesAction(projectId: string) {
  const access = await requireProject(projectId)
  const active = (await getDeploymentsByProject(projectId, 100)).filter(({ deployment }) => ['pending', 'planning', 'deploying'].includes(deployment.status))
  if (!active.length || !access.org.trellisApiUrl || !access.org.trellisApiToken) return
  const client = await getTrellisClient(access.org.id)
  for (const item of active) {
    const deployment = item.deployment
    const [env] = await db.select().from(environments).where(eq(environments.id, deployment.environmentId)).limit(1)
    const [config] = await db.select().from(serviceConfigs).where(and(eq(serviceConfigs.serviceId, deployment.serviceId), eq(serviceConfigs.environmentId, deployment.environmentId))).limit(1)
    if (!env || !config) continue
    try {
      const jobName = deployment.trellisJobName || item.serviceSlug; const allocations = await client.listAllocations({ namespace: env.trellisNamespace, job: jobName })
      const latestRevision = allocations.length ? Math.max(...allocations.map((allocation) => allocation.job_revision)) : 0
      const currentAllocations = allocations.filter((allocation) => allocation.job_revision === latestRevision && allocation.phase !== 'stopped')
      const failed = currentAllocations.some((allocation) => allocation.phase === 'failed' || allocation.phase === 'lost' || allocation.health === 'unhealthy')
      const elapsed = (Date.now() - new Date(deployment.startedAt).getTime()) / 1000
      if (failed && elapsed >= config.autoRollbackSeconds) {
        if (deployment.previousJobSpec) {
          const previous = deployment.previousJobSpec as TrellisJobSpec; await client.applyJob(previous, previous.namespace)
          await db.update(deployments).set({ status: 'rolled_back', completedAt: new Date() }).where(eq(deployments.id, deployment.id)); await event(deployment.id, 'auto_rollback', 'Health threshold elapsed; restored the previous known-good JobSpec.')
        } else {
          await db.update(deployments).set({ status: 'failed', completedAt: new Date() }).where(eq(deployments.id, deployment.id)); await event(deployment.id, 'failed', 'Allocations failed and there is no previous JobSpec to restore.')
        }
        await syncManagedProxy(projectId, env.id, access.org.id).catch(() => undefined)
        await notify(await createSpec(deployment.serviceId, deployment.environmentId), deployment.previousJobSpec ? 'rolled_back' : 'failed', deployment.triggeredByUserId)
        continue
      }
      const healthy = currentAllocations.length > 0 && currentAllocations.every((allocation) => allocation.phase === 'running' && allocation.health === 'healthy')
      if (!healthy) continue
      if (deployment.strategy === 'canary') {
        const steps = config.canarySteps as number[]; const existing = await db.select().from(deploymentEvents).where(eq(deploymentEvents.deploymentId, deployment.id)).orderBy(desc(deploymentEvents.createdAt))
        const previousWeight = Number((existing.find((entry) => entry.type === 'canary_step')?.details as { weight?: number } | undefined)?.weight ?? 0); const nextWeight = steps.find((step) => step > previousWeight) ?? 100
        if (nextWeight < 100) {
          const replicas = Math.max(1, Math.ceil(config.replicas * nextWeight / 100)); const { spec } = await createSpec(deployment.serviceId, deployment.environmentId, jobName, { replicas, labels: { 'trellis/weight': String(nextWeight), 'canopy/canary': 'true' } })
          await client.applyJob(spec, env.trellisNamespace); await event(deployment.id, 'canary_step', `Canary advanced to ${nextWeight}%.`, { weight: nextWeight, replicas }); continue
        }
        await event(deployment.id, 'canary_step', 'Canary reached 100%; traffic switched atomically.', { weight: 100 })
      }
      if (deployment.strategy === 'blue_green' || deployment.strategy === 'canary') {
        const oldJob = config.activeJobName || item.serviceSlug; await db.update(serviceConfigs).set({ activeJobName: jobName, updatedAt: new Date() }).where(eq(serviceConfigs.id, config.id))
        await syncManagedProxy(projectId, env.id, access.org.id); if (oldJob !== jobName) await client.deleteJob(oldJob, env.trellisNamespace).catch(() => undefined)
      }
      await db.update(deployments).set({ status: 'healthy', completedAt: new Date(), trellisRevision: latestRevision }).where(eq(deployments.id, deployment.id))
      await event(deployment.id, 'healthy', 'All allocations are running and healthy.', { allocations: currentAllocations.map((allocation) => ({ id: allocation.id, phase: allocation.phase, health: allocation.health })) })
      await notify(await createSpec(deployment.serviceId, deployment.environmentId), 'healthy', deployment.triggeredByUserId)
    } catch { /* preserve state while Trellis is unreachable */ }
  }
  revalidatePath(`/projects/${access.project.slug}/deployments`)
}

export async function updateServiceConfigAction(serviceId: string, environmentId: string, formData: FormData) {
  const access = await requireService(serviceId); if (access.projectRole !== 'admin') throw new Error('Insufficient permissions.')
  const [before] = await db.select().from(serviceConfigs).where(and(eq(serviceConfigs.serviceId, serviceId), eq(serviceConfigs.environmentId, environmentId))).limit(1); if (!before) throw new Error('Configuration not found.')
  const image = String(formData.get('image') ?? '').trim(); const replicas = Number(formData.get('replicas')); if (!image || !Number.isInteger(replicas) || replicas < 0) throw new Error('A valid image and replica count are required.')
  const tier = String(formData.get('resourceTier') ?? 'custom') as 'small' | 'medium' | 'large' | 'xl' | 'custom'; const tiers = { small: [100, 134217728], medium: [250, 268435456], large: [500, 536870912], xl: [1000, 1073741824] } as const
  const cpu = tier === 'custom' ? Number(formData.get('cpu')) : tiers[tier][0]; const memory = tier === 'custom' ? Number(formData.get('memory')) * 1048576 : tiers[tier][1]
  const secretBindings = jsonField<CanopySecretBinding[]>(formData, 'secretBindings', [])
  const availableSecrets = await db.select({ name: secretsMetadata.trellisSecretName }).from(secretsMetadata).where(eq(secretsMetadata.environmentId, environmentId)); const allowedSecrets = new Set(availableSecrets.map((item) => item.name))
  const invalidSecret = secretBindings.find((binding) => !allowedSecrets.has(binding.name)); if (invalidSecret) throw new Error(`Secret ${invalidSecret.name} does not exist in this environment.`)
  const after = { image, replicas, port: Number(formData.get('port')) || null, resourceTier: tier, cpu, memory, deploymentStrategy: String(formData.get('strategy')) as 'rolling' | 'recreate' | 'blue_green' | 'canary', healthCheckType: (String(formData.get('healthType') ?? '') || null) as 'http' | 'tcp' | 'script' | null, healthCheckPath: String(formData.get('healthPath') ?? '').trim() || null, healthCheckCommand: String(formData.get('healthCommand') ?? '').trim().split(/\s+/).filter(Boolean), healthCheckInterval: Number(formData.get('healthInterval')) || 10, healthCheckTimeout: Number(formData.get('healthTimeout')) || 2, healthCheckThreshold: Number(formData.get('healthThreshold')) || 3, envVars: linesToRecord(String(formData.get('envVars') ?? '')), labels: linesToRecord(String(formData.get('labels') ?? '')), command: String(formData.get('command') ?? '').trim() || null, volumes: jsonField<TrellisVolume[]>(formData, 'volumes', []), secretBindings, rawConfig: jsonField<TrellisJobSpec | null>(formData, 'rawConfig', null), cronSchedule: String(formData.get('cronSchedule') ?? '').trim() || null, autoRollbackSeconds: Math.max(30, Number(formData.get('autoRollbackSeconds')) || 300), canarySteps: jsonField<number[]>(formData, 'canarySteps', [10, 25, 50, 100]), updatedAt: new Date() }
  await db.update(serviceConfigs).set(after).where(eq(serviceConfigs.id, before.id)); await syncManagedProxy(access.project.id, environmentId, access.org.id).catch(() => undefined); await recordAudit({ orgId: access.org.id, userId: access.user.id, action: 'service.config.updated', resourceType: 'service', resourceId: serviceId, details: { before, after } }); revalidatePath(`/projects/${access.project.slug}/services/${access.service.slug}`)
}

export async function upsertSidecarAction(serviceId: string, environmentId: string, formData: FormData) {
  const access = await requireService(serviceId); if (access.projectRole !== 'admin') throw new Error('Insufficient permissions.')
  const [config] = await db.select().from(serviceConfigs).where(and(eq(serviceConfigs.serviceId, serviceId), eq(serviceConfigs.environmentId, environmentId))).limit(1); if (!config) throw new Error('Configuration not found.')
  const id = String(formData.get('id') ?? ''); const values = { serviceConfigId: config.id, name: String(formData.get('name') ?? '').trim(), image: String(formData.get('image') ?? '').trim(), cpu: Number(formData.get('cpu')) || 100, memory: (Number(formData.get('memory')) || 128) * 1048576, port: Number(formData.get('port')) || null, envVars: linesToRecord(String(formData.get('envVars') ?? '')), command: String(formData.get('command') ?? '').trim() || null }
  if (!values.name || !values.image) throw new Error('Sidecar name and image are required.')
  if (id) await db.update(sidecars).set(values).where(and(eq(sidecars.id, id), eq(sidecars.serviceConfigId, config.id))); else await db.insert(sidecars).values(values)
  await recordAudit({ orgId: access.org.id, userId: access.user.id, action: id ? 'sidecar.updated' : 'sidecar.created', resourceType: 'service', resourceId: serviceId, details: values }); revalidatePath(`/projects/${access.project.slug}/services/${access.service.slug}`)
}

export async function deleteSidecarAction(serviceId: string, sidecarId: string) {
  const access = await requireService(serviceId); if (access.projectRole !== 'admin') throw new Error('Insufficient permissions.')
  const [config] = await db.select({ id: serviceConfigs.id }).from(sidecars).innerJoin(serviceConfigs, eq(serviceConfigs.id, sidecars.serviceConfigId)).where(and(eq(sidecars.id, sidecarId), eq(serviceConfigs.serviceId, serviceId))).limit(1); if (!config) throw new Error('Sidecar not found.')
  await db.delete(sidecars).where(eq(sidecars.id, sidecarId)); await recordAudit({ orgId: access.org.id, userId: access.user.id, action: 'sidecar.deleted', resourceType: 'sidecar', resourceId: sidecarId }); revalidatePath(`/projects/${access.project.slug}/services/${access.service.slug}`)
}

export async function scaleServiceAction(serviceId: string, environmentId: string, replicas: number) {
  const access = await requireService(serviceId); if (access.projectRole === 'viewer') throw new Error('Insufficient permissions.')
  const [config] = await db.select().from(serviceConfigs).where(and(eq(serviceConfigs.serviceId, serviceId), eq(serviceConfigs.environmentId, environmentId))).limit(1); if (!config || !Number.isInteger(replicas) || replicas < 0) throw new Error('Invalid replica count.')
  await db.update(serviceConfigs).set({ replicas, pausedReplicas: replicas === 0 ? Math.max(1, config.replicas) : null, updatedAt: new Date() }).where(eq(serviceConfigs.id, config.id)); await recordAudit({ orgId: access.org.id, userId: access.user.id, action: replicas === 0 ? 'service.paused' : 'service.scaled', resourceType: 'service', resourceId: serviceId, details: { environmentId, before: config.replicas, after: replicas } }); await executeDeployment(serviceId, environmentId, 'manual', access.user.id)
}

export async function resumeServiceAction(serviceId: string, environmentId: string) {
  const access = await requireService(serviceId); if (access.projectRole === 'viewer') throw new Error('Insufficient permissions.')
  const [config] = await db.select().from(serviceConfigs).where(and(eq(serviceConfigs.serviceId, serviceId), eq(serviceConfigs.environmentId, environmentId))).limit(1); if (!config?.pausedReplicas) throw new Error('This service is not paused.')
  await db.update(serviceConfigs).set({ replicas: config.pausedReplicas, pausedReplicas: null, updatedAt: new Date() }).where(eq(serviceConfigs.id, config.id)); await executeDeployment(serviceId, environmentId, 'manual', access.user.id); await recordAudit({ orgId: access.org.id, userId: access.user.id, action: 'service.resumed', resourceType: 'service', resourceId: serviceId, details: { environmentId, replicas: config.pausedReplicas } })
}

export async function deleteServiceAction(serviceId: string, projectSlug: string): Promise<{ error?: string }> {
  const access = await requireService(serviceId); if (access.projectRole !== 'admin') return { error: 'Insufficient permissions.' }
  const configs = await db.select({ config: serviceConfigs, environment: environments }).from(serviceConfigs).innerJoin(environments, eq(environments.id, serviceConfigs.environmentId)).where(eq(serviceConfigs.serviceId, serviceId))
  const client = await getTrellisClient(access.org.id)
  for (const { config, environment } of configs) {
    const names = new Set([access.service.slug, config.activeJobName, `${access.service.slug}-blue`, `${access.service.slug}-green`, `${access.service.slug}-canary-a`, `${access.service.slug}-canary-b`].filter(Boolean) as string[])
    await Promise.allSettled([...names].map((name) => client.deleteJob(name, environment.trellisNamespace)))
  }
  await db.delete(services).where(eq(services.id, serviceId)); await Promise.allSettled(configs.map(({ environment }) => syncManagedProxy(access.project.id, environment.id, access.org.id)))
  await recordAudit({ orgId: access.org.id, userId: access.user.id, action: 'service.deleted', resourceType: 'service', resourceId: serviceId }); redirect(`/projects/${projectSlug}`)
}
