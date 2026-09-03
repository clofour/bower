'use server'

import { randomBytes } from 'crypto'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { hash } from 'bcryptjs'
import { db } from '@/db'
import { apiKeys } from '@/db/schema'
import { getCurrentUser } from '@/lib/auth'
import { getUserOrganization } from '@/lib/queries'

export async function createApiKeyAction(
  formData: FormData,
): Promise<{ error?: string; key?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated.' }

  const ctx = await getUserOrganization(user.id)
  if (!ctx) return { error: 'No organization found.' }
  if (ctx.role === 'member') return { error: 'Insufficient permissions.' }

  const name = formData.get('name')
  if (typeof name !== 'string' || !name.trim()) {
    return { error: 'Key name is required.' }
  }

  const rawKey = `cnpy_${randomBytes(32).toString('hex')}`
  const keyPrefix = rawKey.slice(0, 12)
  const keyHash = await hash(rawKey, 10)

  await db.insert(apiKeys).values({
    orgId: ctx.org.id,
    userId: user.id,
    name: name.trim(),
    keyHash,
    keyPrefix,
  })

  return { key: rawKey }
}

export async function deleteApiKeyAction(
  keyId: string,
): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated.' }

  const ctx = await getUserOrganization(user.id)
  if (!ctx) return { error: 'No organization found.' }
  if (ctx.role === 'member') return { error: 'Insufficient permissions.' }

  await db.delete(apiKeys).where(eq(apiKeys.id, keyId))

  redirect('/settings/organization/api-keys')
}
