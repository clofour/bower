'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import {
  environments, routes, secretsMetadata, services, teams, teamMemberships,
  teamProjectAccess, users, serviceTemplates, projects,
} from '@/db/schema'
import { getTrellisClient } from '@/lib/trellis-instance'
import { integer, recordAudit, requireContext, requireProject, text } from './shared'

export async function createEnvironmentAction(projectId: string, formData: FormData) {
  const ctx = await requireProject(projectId)
  if (ctx.projectRole !== 'admin') throw new Error('Insufficient permissions.')
  const name = text(formData, 'name')
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  if (!slug) throw new Error('Environment name is required.')
  const [last] = await db.select().from(environments).where(eq(environments.projectId, projectId))
    .orderBy(environments.promotionOrder)
  try {
    const [env] = await db.insert(environments).values({
      projectId, name, slug, trellisNamespace: `${ctx.project.slug}-${slug}`,
      promotionOrder: (last?.promotionOrder ?? -1) + 1,
      defaultReplicas: Math.max(0, integer(formData, 'replicas', 1)),
    }).returning()
    await recordAudit({ orgId: ctx.org.id, userId: ctx.user.id, action: 'environment.created',
      resourceType: 'environment', resourceId: env.id, details: { name } })
  } catch { throw new Error('An environment with this name already exists.') }
  revalidatePath(`/projects/${ctx.project.slug}/environments`)
}

export async function toggleEnvironmentLockAction(projectId: string, environmentId: string, locked: boolean) {
  const ctx = await requireProject(projectId)
  if (ctx.projectRole !== 'admin') throw new Error('Insufficient permissions.')
  await db.update(environments).set({ isLocked: locked, updatedAt: new Date() })
    .where(and(eq(environments.id, environmentId), eq(environments.projectId, projectId)))
  await recordAudit({ orgId: ctx.org.id, userId: ctx.user.id,
    action: locked ? 'environment.locked' : 'environment.unlocked',
    resourceType: 'environment', resourceId: environmentId })
  revalidatePath(`/projects/${ctx.project.slug}/environments`)
}

export async function deleteEnvironmentAction(projectId: string, environmentId: string) {
  const ctx = await requireProject(projectId)
  if (ctx.projectRole !== 'admin') throw new Error('Insufficient permissions.')
  const [service] = await db.select({ id: services.id }).from(services).where(eq(services.projectId, projectId)).limit(1)
  if (service) throw new Error('Delete project services before removing environments.')
  await db.delete(environments).where(and(eq(environments.id, environmentId), eq(environments.projectId, projectId)))
  await recordAudit({ orgId: ctx.org.id, userId: ctx.user.id, action: 'environment.deleted', resourceType: 'environment', resourceId: environmentId })
  revalidatePath(`/projects/${ctx.project.slug}/environments`)
}

export async function createRouteAction(projectId: string, formData: FormData) {
  const ctx = await requireProject(projectId)
  if (ctx.projectRole !== 'admin') throw new Error('Insufficient permissions.')
  const domain = text(formData, 'domain').toLowerCase()
  const serviceId = text(formData, 'serviceId')
  const environmentId = text(formData, 'environmentId')
  const port = integer(formData, 'port', 8080)
  if (!domain || !serviceId || !environmentId) throw new Error('Domain, service, and environment are required.')
  const [service] = await db.select().from(services)
    .where(and(eq(services.id, serviceId), eq(services.projectId, projectId))).limit(1)
  const [environment] = await db.select().from(environments)
    .where(and(eq(environments.id, environmentId), eq(environments.projectId, projectId))).limit(1)
  if (!service || !environment) throw new Error('Invalid route target.')
  const [route] = await db.insert(routes).values({
    projectId, serviceId, environmentId, domain,
    pathPrefix: text(formData, 'pathPrefix') || '/', port,
    tlsMode: text(formData, 'tlsMode') as 'auto' | 'custom' | 'none',
  }).returning()
  await recordAudit({ orgId: ctx.org.id, userId: ctx.user.id, action: 'route.created',
    resourceType: 'route', resourceId: route.id, details: { domain, service: service.slug } })
  revalidatePath(`/projects/${ctx.project.slug}/routes`)
}

export async function deleteRouteAction(projectId: string, routeId: string) {
  const ctx = await requireProject(projectId)
  if (ctx.projectRole !== 'admin') throw new Error('Insufficient permissions.')
  await db.delete(routes).where(and(eq(routes.id, routeId), eq(routes.projectId, projectId)))
  await recordAudit({ orgId: ctx.org.id, userId: ctx.user.id, action: 'route.deleted',
    resourceType: 'route', resourceId: routeId })
  revalidatePath(`/projects/${ctx.project.slug}/routes`)
}

export async function setSecretAction(projectId: string, formData: FormData) {
  const ctx = await requireProject(projectId)
  if (ctx.projectRole !== 'admin') throw new Error('Insufficient permissions.')
  const environmentId = text(formData, 'environmentId')
  const name = text(formData, 'name').toUpperCase().replace(/[^A-Z0-9_]/g, '_')
  const value = text(formData, 'value')
  const [environment] = await db.select().from(environments)
    .where(and(eq(environments.id, environmentId), eq(environments.projectId, projectId))).limit(1)
  if (!environment || !name || !value) throw new Error('Environment, name, and value are required.')
  try {
    const client = await getTrellisClient(ctx.org.id)
    await client.setSecret(environment.trellisNamespace, name, value)
    await db.insert(secretsMetadata).values({ projectId, environmentId, name,
      trellisSecretName: name, lastRotatedAt: new Date() }).onConflictDoUpdate({
        target: [secretsMetadata.environmentId, secretsMetadata.name],
        set: { lastRotatedAt: new Date(), updatedAt: new Date() },
      })
    await recordAudit({ orgId: ctx.org.id, userId: ctx.user.id, action: 'secret.rotated',
      resourceType: 'secret', resourceId: `${environmentId}:${name}`, details: { name } })
  } catch (error) { throw new Error(error instanceof Error ? error.message : 'Could not store secret.') }
  revalidatePath(`/projects/${ctx.project.slug}/secrets`)
}

export async function deleteSecretAction(projectId: string, secretId: string) {
  const ctx = await requireProject(projectId)
  if (ctx.projectRole !== 'admin') throw new Error('Insufficient permissions.')
  const [row] = await db.select({ secret: secretsMetadata, env: environments })
    .from(secretsMetadata).innerJoin(environments, eq(environments.id, secretsMetadata.environmentId))
    .where(and(eq(secretsMetadata.id, secretId), eq(secretsMetadata.projectId, projectId))).limit(1)
  if (!row) return
  const client = await getTrellisClient(ctx.org.id)
  await client.deleteSecret(row.env.trellisNamespace, row.secret.trellisSecretName)
  await db.delete(secretsMetadata).where(eq(secretsMetadata.id, secretId))
  await recordAudit({ orgId: ctx.org.id, userId: ctx.user.id, action: 'secret.deleted',
    resourceType: 'secret', resourceId: secretId, details: { name: row.secret.name } })
  revalidatePath(`/projects/${ctx.project.slug}/secrets`)
}

export async function setNodeDrainAction(nodeId: string, drain: boolean) {
  const ctx = await requireContext()
  if (ctx.role !== 'owner') throw new Error('Only organization owners can change node state.')
  try {
    const client = await getTrellisClient(ctx.org.id)
    if (drain) await client.drainNode(nodeId); else await client.undrainNode(nodeId)
    await recordAudit({ orgId: ctx.org.id, userId: ctx.user.id,
      action: drain ? 'node.drained' : 'node.undrained', resourceType: 'node', resourceId: nodeId })
  } catch (error) { throw new Error(error instanceof Error ? error.message : 'Node action failed.') }
  revalidatePath('/cluster')
}

export async function createTeamAction(formData: FormData) {
  const ctx = await requireContext()
  if (ctx.role !== 'owner' && ctx.role !== 'admin') throw new Error('Insufficient permissions.')
  const name = text(formData, 'name')
  if (!name) throw new Error('Team name is required.')
  const [team] = await db.insert(teams).values({ orgId: ctx.org.id, name }).returning()
  await recordAudit({ orgId: ctx.org.id, userId: ctx.user.id, action: 'team.created',
    resourceType: 'team', resourceId: team.id, details: { name } })
  revalidatePath('/settings/teams')
}

export async function addTeamMemberAction(teamId: string, formData: FormData) {
  const ctx = await requireContext()
  if (ctx.role !== 'owner' && ctx.role !== 'admin') throw new Error('Insufficient permissions.')
  const email = text(formData, 'email').toLowerCase()
  const [team] = await db.select().from(teams).where(and(eq(teams.id, teamId), eq(teams.orgId, ctx.org.id))).limit(1)
  const [member] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (!team || !member) throw new Error('No organization user has that email.')
  await db.insert(teamMemberships).values({ teamId, userId: member.id }).onConflictDoNothing()
  revalidatePath('/settings/teams')
}

export async function grantTeamProjectAction(teamId: string, formData: FormData) {
  const ctx = await requireContext()
  if (ctx.role !== 'owner' && ctx.role !== 'admin') throw new Error('Insufficient permissions.')
  const projectId = text(formData, 'projectId')
  const [project] = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.orgId, ctx.org.id))).limit(1)
  if (!project) throw new Error('Project is required.')
  await db.insert(teamProjectAccess).values({ teamId, projectId,
    role: text(formData, 'role') as 'admin' | 'deployer' | 'viewer' }).onConflictDoUpdate({
      target: [teamProjectAccess.teamId, teamProjectAccess.projectId],
      set: { role: text(formData, 'role') as 'admin' | 'deployer' | 'viewer' },
    })
  revalidatePath('/settings/teams')
}

export async function createTemplateAction(formData: FormData) {
  const ctx = await requireContext()
  if (ctx.role === 'member') throw new Error('Insufficient permissions.')
  const name = text(formData, 'name')
  const image = text(formData, 'image')
  const type = text(formData, 'type') as 'web' | 'worker' | 'cron' | 'custom'
  if (!name || !image) throw new Error('Name and image are required.')
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const [template] = await db.insert(serviceTemplates).values({ orgId: ctx.org.id, name, slug, type,
    description: text(formData, 'description') || null,
    config: { image, port: integer(formData, 'port', type === 'web' ? 8080 : 0), replicas: integer(formData, 'replicas', 1) },
  }).returning()
  await recordAudit({ orgId: ctx.org.id, userId: ctx.user.id, action: 'template.created', resourceType: 'template', resourceId: template.id, details: { name } })
  revalidatePath('/settings/templates')
}
