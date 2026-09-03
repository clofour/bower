'use server'

import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { organizations, users } from '@/db/schema'
import { getCurrentUser, hashPassword, verifyPassword } from '@/lib/auth'
import { getUserOrganization } from '@/lib/queries'

export async function updateOrganizationAction(
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated.' }

  const ctx = await getUserOrganization(user.id)
  if (!ctx) return { error: 'No organization found.' }
  if (ctx.role === 'member') return { error: 'Insufficient permissions.' }

  const name = formData.get('name')
  const trellisApiUrl = formData.get('trellisApiUrl')
  const trellisApiToken = formData.get('trellisApiToken')

  const updates: Record<string, unknown> = { updatedAt: new Date() }

  if (typeof name === 'string' && name.trim()) {
    updates.name = name.trim()
  }
  if (typeof trellisApiUrl === 'string') {
    updates.trellisApiUrl = trellisApiUrl.trim()
  }
  if (typeof trellisApiToken === 'string' && trellisApiToken.trim()) {
    updates.trellisApiToken = trellisApiToken.trim()
  }

  await db
    .update(organizations)
    .set(updates)
    .where(eq(organizations.id, ctx.org.id))

  return { success: true }
}

export async function updateAccountAction(
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated.' }

  const name = formData.get('name')
  const email = formData.get('email')

  const updates: Record<string, unknown> = { updatedAt: new Date() }

  if (typeof name === 'string' && name.trim()) {
    updates.name = name.trim()
  }
  if (typeof email === 'string' && email.trim()) {
    updates.email = email.toLowerCase().trim()
  }

  await db.update(users).set(updates).where(eq(users.id, user.id))

  return { success: true }
}

export async function changePasswordAction(
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated.' }

  const currentPassword = formData.get('currentPassword')
  const newPassword = formData.get('newPassword')

  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
    return { error: 'Both passwords are required.' }
  }

  if (newPassword.length < 8) {
    return { error: 'New password must be at least 8 characters.' }
  }

  const userRows = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1)

  if (userRows.length === 0) return { error: 'User not found.' }

  const valid = await verifyPassword(currentPassword, userRows[0].passwordHash)
  if (!valid) return { error: 'Current password is incorrect.' }

  const newHash = await hashPassword(newPassword)
  await db
    .update(users)
    .set({ passwordHash: newHash, updatedAt: new Date() })
    .where(eq(users.id, user.id))

  return { success: true }
}
