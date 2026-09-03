import { eq, and } from 'drizzle-orm'
import { db } from '@/db'
import {
  deployments,
  serviceConfigs,
  services,
  environments,
  projects,
  organizations,
  sidecars,
} from '@/db/schema'
import { getTrellisClient } from '@/lib/trellis-instance'
import { buildJobSpec, type CanopyServiceConfig, type CanopySidecar } from '@/lib/job-builder'

export async function executeDeployment(deploymentId: string): Promise<void> {
  const depRows = await db
    .select()
    .from(deployments)
    .where(eq(deployments.id, deploymentId))
    .limit(1)
  if (depRows.length === 0) throw new Error('Deployment not found')

  const dep = depRows[0]

  await db
    .update(deployments)
    .set({ status: 'planning' })
    .where(eq(deployments.id, deploymentId))

  try {
    const configRows = await db
      .select()
      .from(serviceConfigs)
      .where(
        and(
          eq(serviceConfigs.serviceId, dep.serviceId),
          eq(serviceConfigs.environmentId, dep.environmentId),
        ),
      )
      .limit(1)
    if (configRows.length === 0) throw new Error('Service config not found')
    const config = configRows[0]

    const svcRows = await db
      .select()
      .from(services)
      .where(eq(services.id, dep.serviceId))
      .limit(1)
    if (svcRows.length === 0) throw new Error('Service not found')
    const svc = svcRows[0]

    const envRows = await db
      .select()
      .from(environments)
      .where(eq(environments.id, dep.environmentId))
      .limit(1)
    if (envRows.length === 0) throw new Error('Environment not found')
    const env = envRows[0]

    const projectRows = await db
      .select()
      .from(projects)
      .where(eq(projects.id, svc.projectId))
      .limit(1)
    if (projectRows.length === 0) throw new Error('Project not found')

    const sidecarRows = await db
      .select()
      .from(sidecars)
      .where(eq(sidecars.serviceConfigId, config.id))

    const sidecarConfigs: CanopySidecar[] = sidecarRows.map((s) => ({
      name: s.name,
      image: s.image,
      cpu: s.cpu,
      memory: s.memory,
      port: s.port ?? undefined,
      envVars: (s.envVars as Record<string, string>) ?? {},
      command: s.command ?? undefined,
    }))

    const canopyConfig: CanopyServiceConfig = {
      name: `${projectRows[0].slug}-${svc.slug}`,
      namespace: env.trellisNamespace,
      type: svc.type,
      image: dep.imageAfter,
      port: config.port ?? undefined,
      replicas: config.replicas,
      cpu: config.cpu,
      memory: config.memory,
      healthCheckPath: config.healthCheckPath ?? undefined,
      healthCheckType: config.healthCheckType ?? undefined,
      deploymentStrategy: config.deploymentStrategy,
      envVars: (config.envVars as Record<string, string>) ?? {},
      secrets: [],
      labels: (config.labels as Record<string, string>) ?? {},
      command: config.command ?? undefined,
      sidecars: sidecarConfigs,
    }

    const jobSpec = buildJobSpec(canopyConfig)

    const client = await getTrellisClient(projectRows[0].orgId)

    await db
      .update(deployments)
      .set({ status: 'deploying' })
      .where(eq(deployments.id, deploymentId))

    const result = await client.applyJob(jobSpec, env.trellisNamespace)

    await db
      .update(deployments)
      .set({
        status: 'healthy',
        trellisRevision: result.revision ?? null,
        completedAt: new Date(),
      })
      .where(eq(deployments.id, deploymentId))
  } catch (error) {
    await db
      .update(deployments)
      .set({
        status: 'failed',
        completedAt: new Date(),
        planDiff: { error: error instanceof Error ? error.message : String(error) },
      })
      .where(eq(deployments.id, deploymentId))
    throw error
  }
}
