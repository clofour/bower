'use server'

import { redirect } from 'next/navigation'
import { eq, and } from 'drizzle-orm'
import { db } from '@/db'
import { services, serviceConfigs, deployments, environments } from '@/db/schema'
import { getCurrentUser } from '@/lib/auth'
import { getUserOrganization, getProjectBySlug } from '@/lib/queries'

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

  redirect(`/projects/${projectSlug}`)
}

export async function deployServiceAction(
  serviceId: string,
  environmentId: string,
): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated.' }

  const svcRows = await db
    .select()
    .from(services)
    .where(eq(services.id, serviceId))
    .limit(1)
  if (svcRows.length === 0) return { error: 'Service not found.' }

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
  if (configRows.length === 0) return { error: 'No configuration found for this environment.' }

  const config = configRows[0]

  await db.insert(deployments).values({
    serviceId,
    environmentId,
    imageAfter: config.image,
    strategy: config.deploymentStrategy,
    status: 'pending',
    triggeredByUserId: user.id,
    triggerType: 'manual',
  })

  return {}
}

export async function deleteServiceAction(
  serviceId: string,
  projectSlug: string,
): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated.' }

  await db.delete(services).where(eq(services.id, serviceId))

  redirect(`/projects/${projectSlug}`)
}
