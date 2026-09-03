'use server'

import { redirect } from 'next/navigation'
import { eq, and } from 'drizzle-orm'
import { db } from '@/db'
import { projects, environments } from '@/db/schema'
import { getCurrentUser } from '@/lib/auth'
import { getUserOrganization } from '@/lib/queries'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 63) || 'project'
}

export async function createProjectAction(
  formData: FormData,
): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated.' }

  const ctx = await getUserOrganization(user.id)
  if (!ctx) return { error: 'No organization found.' }

  const name = formData.get('name')
  const description = formData.get('description')

  if (typeof name !== 'string' || !name.trim()) {
    return { error: 'Project name is required.' }
  }

  const slug = slugify(name.trim())

  const existing = await db
    .select()
    .from(projects)
    .where(and(eq(projects.orgId, ctx.org.id), eq(projects.slug, slug)))
    .limit(1)

  if (existing.length > 0) {
    return { error: 'A project with this name already exists.' }
  }

  const [project] = await db
    .insert(projects)
    .values({
      orgId: ctx.org.id,
      name: name.trim(),
      slug,
      description: typeof description === 'string' ? description.trim() || null : null,
    })
    .returning({ id: projects.id, slug: projects.slug })

  await db.insert(environments).values([
    {
      projectId: project.id,
      name: 'Development',
      slug: 'development',
      trellisNamespace: `${slug}-dev`,
      promotionOrder: 0,
    },
    {
      projectId: project.id,
      name: 'Staging',
      slug: 'staging',
      trellisNamespace: `${slug}-staging`,
      promotionOrder: 1,
    },
    {
      projectId: project.id,
      name: 'Production',
      slug: 'production',
      trellisNamespace: `${slug}-prod`,
      promotionOrder: 2,
      isLocked: true,
    },
  ])

  redirect(`/projects/${project.slug}`)
}

export async function deleteProjectAction(
  projectId: string,
): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated.' }

  const ctx = await getUserOrganization(user.id)
  if (!ctx) return { error: 'No organization found.' }
  if (ctx.role === 'member') return { error: 'Insufficient permissions.' }

  await db
    .delete(projects)
    .where(and(eq(projects.id, projectId), eq(projects.orgId, ctx.org.id)))

  redirect('/projects')
}
