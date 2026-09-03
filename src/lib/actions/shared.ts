import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { auditLog, projects, services, teamMemberships, teamProjectAccess } from '@/db/schema'
import { getCurrentUser } from '@/lib/auth'
import { getUserOrganization } from '@/lib/queries'

export async function requireContext() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated.')
  const ctx = await getUserOrganization(user.id)
  if (!ctx) throw new Error('No organization found.')
  return { user, ...ctx }
}

export async function requireProject(projectId: string) {
  const ctx = await requireContext()
  const [project] = await db.select().from(projects).where(and(
    eq(projects.id, projectId), eq(projects.orgId, ctx.org.id),
  )).limit(1)
  if (!project) throw new Error('Project not found.')
  const projectRole = await getProjectRole(ctx.user.id, ctx.role, projectId)
  if (!projectRole) throw new Error('Project not found.')
  return { ...ctx, project, projectRole }
}

export async function requireService(serviceId: string) {
  const ctx = await requireContext()
  const [row] = await db.select({ service: services, project: projects })
    .from(services).innerJoin(projects, eq(projects.id, services.projectId))
    .where(and(eq(services.id, serviceId), eq(projects.orgId, ctx.org.id))).limit(1)
  if (!row) throw new Error('Service not found.')
  const projectRole = await getProjectRole(ctx.user.id, ctx.role, row.project.id)
  if (!projectRole) throw new Error('Service not found.')
  return { ...ctx, ...row, projectRole }
}

async function getProjectRole(userId: string, orgRole: 'owner' | 'admin' | 'member', projectId: string) {
  if (orgRole === 'owner' || orgRole === 'admin') return 'admin' as const
  const grants = await db.select({ role: teamProjectAccess.role }).from(teamMemberships)
    .innerJoin(teamProjectAccess, eq(teamProjectAccess.teamId, teamMemberships.teamId))
    .where(and(eq(teamMemberships.userId, userId), eq(teamProjectAccess.projectId, projectId)))
  if (grants.some((grant) => grant.role === 'admin')) return 'admin' as const
  if (grants.some((grant) => grant.role === 'deployer')) return 'deployer' as const
  if (grants.some((grant) => grant.role === 'viewer')) return 'viewer' as const
  return null
}

export async function recordAudit(input: {
  orgId: string; userId: string | null; action: string; resourceType: string;
  resourceId: string; details?: Record<string, unknown>
}) {
  await db.insert(auditLog).values({
    orgId: input.orgId, userId: input.userId, action: input.action,
    resourceType: input.resourceType, resourceId: input.resourceId,
    details: input.details ?? {},
  })
}

export function text(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

export function integer(formData: FormData, key: string, fallback: number) {
  const value = Number(text(formData, key))
  return Number.isInteger(value) ? value : fallback
}
