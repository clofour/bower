'use server'

import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { teams } from '@/db/schema'
import { getCurrentUser } from '@/lib/auth'
import { getUserOrganization } from '@/lib/queries'

export async function createTeamAction(
  formData: FormData,
): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated.' }

  const ctx = await getUserOrganization(user.id)
  if (!ctx) return { error: 'No organization found.' }
  if (ctx.role === 'member') return { error: 'Insufficient permissions.' }

  const name = formData.get('name')
  if (typeof name !== 'string' || !name.trim()) {
    return { error: 'Team name is required.' }
  }

  await db.insert(teams).values({
    orgId: ctx.org.id,
    name: name.trim(),
  })

  redirect('/settings/organization/teams')
}
