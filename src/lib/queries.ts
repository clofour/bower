import { eq, and, desc } from 'drizzle-orm'
import { db } from '@/db'
import {
  organizations,
  organizationMembers,
  projects,
  environments,
  services,
  serviceConfigs,
  deployments,
  routes,
  teams,
  teamMemberships,
  teamProjectAccess,
  auditLog,
  secretsMetadata,
  serviceTemplates,
  webhookEndpoints,
  notificationChannels,
  sidecars,
  apiKeys,
  managedProxies,
  deploymentEvents,
  users,
  sharedSecretGroups,
  sharedSecretMembers,
} from '@/db/schema'

export async function getUserOrganization(userId: string) {
  const rows = await db
    .select({
      org: organizations,
      membership: organizationMembers,
    })
    .from(organizationMembers)
    .innerJoin(organizations, eq(organizations.id, organizationMembers.orgId))
    .where(eq(organizationMembers.userId, userId))
    .limit(1)

  if (rows.length === 0) return null
  return { org: rows[0].org, role: rows[0].membership.role }
}

export async function getProjectsByOrg(orgId: string) {
  return db
    .select()
    .from(projects)
    .where(eq(projects.orgId, orgId))
    .orderBy(desc(projects.updatedAt))
}

export async function getProjectsForUser(orgId: string, userId: string, orgRole: 'owner' | 'admin' | 'member') {
  if (orgRole !== 'member') return getProjectsByOrg(orgId)
  return db.selectDistinct({ project: projects }).from(projects)
    .innerJoin(teamProjectAccess, eq(teamProjectAccess.projectId, projects.id))
    .innerJoin(teamMemberships, and(eq(teamMemberships.teamId, teamProjectAccess.teamId), eq(teamMemberships.userId, userId)))
    .where(eq(projects.orgId, orgId)).orderBy(desc(projects.updatedAt)).then((rows) => rows.map((row) => row.project))
}

export async function getProjectBySlug(orgId: string, slug: string) {
  const rows = await db
    .select()
    .from(projects)
    .where(and(eq(projects.orgId, orgId), eq(projects.slug, slug)))
    .limit(1)
  return rows[0] ?? null
}

export async function getServicesByProject(projectId: string) {
  return db
    .select()
    .from(services)
    .where(eq(services.projectId, projectId))
    .orderBy(services.name)
}

export async function getEnvironmentsByProject(projectId: string) {
  return db
    .select()
    .from(environments)
    .where(eq(environments.projectId, projectId))
    .orderBy(environments.promotionOrder)
}

export async function getServiceConfigs(serviceId: string) {
  return db
    .select()
    .from(serviceConfigs)
    .where(eq(serviceConfigs.serviceId, serviceId))
}

export async function getServiceBySlug(projectId: string, slug: string) {
  const rows = await db.select().from(services).where(and(
    eq(services.projectId, projectId), eq(services.slug, slug),
  )).limit(1)
  return rows[0] ?? null
}

export async function getServiceConfigsWithEnvironments(serviceId: string) {
  return db.select({ config: serviceConfigs, environment: environments })
    .from(serviceConfigs)
    .innerJoin(environments, eq(environments.id, serviceConfigs.environmentId))
    .where(eq(serviceConfigs.serviceId, serviceId))
    .orderBy(environments.promotionOrder)
}

export async function getSidecars(serviceConfigId: string) {
  return db.select().from(sidecars).where(eq(sidecars.serviceConfigId, serviceConfigId))
}

export async function getDeploymentsByService(
  serviceId: string,
  limit = 20,
) {
  return db
    .select()
    .from(deployments)
    .where(eq(deployments.serviceId, serviceId))
    .orderBy(desc(deployments.createdAt))
    .limit(limit)
}

export async function getDeploymentsByProject(
  projectId: string,
  limit = 50,
) {
  const svcIds = await db
    .select({ id: services.id })
    .from(services)
    .where(eq(services.projectId, projectId))

  if (svcIds.length === 0) return []

  const { inArray } = await import('drizzle-orm')
  return db
    .select({
      deployment: deployments,
      serviceName: services.name,
      serviceSlug: services.slug,
      environmentName: environments.name,
      userName: users.name,
    })
    .from(deployments)
    .innerJoin(services, eq(services.id, deployments.serviceId))
    .innerJoin(environments, eq(environments.id, deployments.environmentId))
    .leftJoin(users, eq(users.id, deployments.triggeredByUserId))
    .where(
      inArray(
        deployments.serviceId,
        svcIds.map((s) => s.id),
      ),
    )
    .orderBy(desc(deployments.createdAt))
    .limit(limit)
}

export async function getRoutesByProject(projectId: string) {
  return db
    .select({
      route: routes,
      serviceName: services.name,
      environmentName: environments.name,
    })
    .from(routes)
    .innerJoin(services, eq(services.id, routes.serviceId))
    .innerJoin(environments, eq(environments.id, routes.environmentId))
    .where(eq(routes.projectId, projectId))
    .orderBy(routes.domain)
}

export async function getManagedProxies(projectId: string) {
  return db.select({ proxy: managedProxies, environmentName: environments.name }).from(managedProxies).innerJoin(environments, eq(environments.id, managedProxies.environmentId)).where(eq(environments.projectId, projectId))
}

export async function getDeploymentEvents(deploymentIds: string[]) {
  if (!deploymentIds.length) return []
  const { inArray } = await import('drizzle-orm')
  return db.select().from(deploymentEvents).where(inArray(deploymentEvents.deploymentId, deploymentIds)).orderBy(deploymentEvents.createdAt)
}

export async function getTeamsByOrg(orgId: string) {
  return db.select().from(teams).where(eq(teams.orgId, orgId)).orderBy(teams.name)
}

export async function getTeamMembers(teamId: string) {
  const { users } = await import('@/db/schema')
  return db
    .select({
      membership: teamMemberships,
      userName: users.name,
      userEmail: users.email,
    })
    .from(teamMemberships)
    .innerJoin(users, eq(users.id, teamMemberships.userId))
    .where(eq(teamMemberships.teamId, teamId))
}

export async function getTeamProjectAccessList(teamId: string) {
  return db
    .select({
      access: teamProjectAccess,
      projectName: projects.name,
      projectSlug: projects.slug,
    })
    .from(teamProjectAccess)
    .innerJoin(projects, eq(projects.id, teamProjectAccess.projectId))
    .where(eq(teamProjectAccess.teamId, teamId))
}

export async function getOrgMembers(orgId: string) {
  const { users } = await import('@/db/schema')
  return db
    .select({
      membership: organizationMembers,
      userName: users.name,
      userEmail: users.email,
      userAvatar: users.avatarUrl,
    })
    .from(organizationMembers)
    .innerJoin(users, eq(users.id, organizationMembers.userId))
    .where(eq(organizationMembers.orgId, orgId))
}

export async function getAuditLog(orgId: string, limit = 50) {
  const { users } = await import('@/db/schema')
  return db
    .select({
      entry: auditLog,
      userName: users.name,
    })
    .from(auditLog)
    .leftJoin(users, eq(users.id, auditLog.userId))
    .where(eq(auditLog.orgId, orgId))
    .orderBy(desc(auditLog.createdAt))
    .limit(limit)
}

export async function getSecretsByProject(projectId: string) {
  return db.select({ secret: secretsMetadata, environmentName: environments.name, sharedName: sharedSecretGroups.name })
    .from(secretsMetadata)
    .innerJoin(environments, eq(environments.id, secretsMetadata.environmentId))
    .leftJoin(sharedSecretMembers, eq(sharedSecretMembers.secretMetadataId, secretsMetadata.id))
    .leftJoin(sharedSecretGroups, eq(sharedSecretGroups.id, sharedSecretMembers.groupId))
    .where(eq(secretsMetadata.projectId, projectId))
    .orderBy(environments.promotionOrder, secretsMetadata.name)
}

export async function getTemplates(orgId: string) {
  const { or, isNull } = await import('drizzle-orm')
  return db.select().from(serviceTemplates)
    .where(or(eq(serviceTemplates.orgId, orgId), isNull(serviceTemplates.orgId)))
    .orderBy(serviceTemplates.name)
}

export async function getProjectIntegrations(projectId: string) {
  const serviceIds = await db.select({ id: services.id }).from(services)
    .where(eq(services.projectId, projectId))
  const hooks = serviceIds.length
    ? await db.select({ hook: webhookEndpoints, serviceName: services.name, environmentName: environments.name }).from(webhookEndpoints)
      .innerJoin(services, eq(services.id, webhookEndpoints.serviceId))
      .innerJoin(environments, eq(environments.id, webhookEndpoints.environmentId))
      .where((await import('drizzle-orm')).inArray(webhookEndpoints.serviceId, serviceIds.map((s) => s.id)))
    : []
  const channels = await db.select().from(notificationChannels)
    .where(eq(notificationChannels.projectId, projectId))
  return { hooks, channels }
}

export async function getApiKeys(userId: string) {
  return db.select().from(apiKeys).where(eq(apiKeys.userId, userId)).orderBy(desc(apiKeys.createdAt))
}
