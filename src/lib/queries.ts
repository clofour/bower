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
    })
    .from(deployments)
    .innerJoin(services, eq(services.id, deployments.serviceId))
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
