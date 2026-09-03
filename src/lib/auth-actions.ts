'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { createHash } from 'node:crypto'
import { db } from '@/db'
import { users, organizationMembers, inviteTokens } from '@/db/schema'
import {
  hashPassword,
  verifyPassword,
  createSession,
  deleteSession,
  getSessionCookieConfig,
  SESSION_COOKIE_NAME,
} from '@/lib/auth'
import { verifyTotpCode } from '@/lib/totp'
import { recordAudit } from '@/lib/actions/shared'

export async function loginAction(
  formData: FormData
): Promise<{ error?: string }> {
  const email = formData.get('email')
  const password = formData.get('password')
  const totpCode = formData.get('totpCode')

  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    !email ||
    !password
  ) {
    return { error: 'Email and password are required.' }
  }

  const normalizedEmail = email.toLowerCase().trim()

  const userRows = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1)

  if (userRows.length === 0) {
    return { error: 'Invalid email or password.' }
  }

  const user = userRows[0]
  const passwordValid = await verifyPassword(password, user.passwordHash)

  if (!passwordValid) {
    return { error: 'Invalid email or password.' }
  }

  if (user.totpEnabled && (!user.totpSecret || typeof totpCode !== 'string' || !verifyTotpCode(user.totpSecret, totpCode))) {
    return { error: 'Enter a valid authenticator code.' }
  }

  const { token, expiresAt } = await createSession(user.id)
  const cookieStore = await cookies()
  cookieStore.set(getSessionCookieConfig(token, expiresAt))

  redirect('/dashboard')
}

export async function registerAction(
  formData: FormData
): Promise<{ error?: string }> {
  const email = formData.get('email')
  const password = formData.get('password')
  const name = formData.get('name')
  const inviteToken = formData.get('inviteToken')

  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    typeof name !== 'string' ||
    typeof inviteToken !== 'string' ||
    !email ||
    !password ||
    !name ||
    !inviteToken
  ) {
    return { error: 'Name, email, password, and invite token are required.' }
  }

  const normalizedEmail = email.toLowerCase().trim()
  const trimmedName = name.trim()
  const trimmedToken = inviteToken.trim()

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }

  // Validate invite token
  const tokenHash = createHash('sha256').update(trimmedToken).digest('hex')
  const tokenRows = await db
    .select()
    .from(inviteTokens)
    .where(eq(inviteTokens.tokenHash, tokenHash))
    .limit(1)

  if (tokenRows.length === 0) {
    return { error: 'Invalid invite token.' }
  }

  const invite = tokenRows[0]

  if (invite.usedAt) {
    return { error: 'This invite token has already been used.' }
  }

  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return { error: 'This invite token has expired.' }
  }

  // Check email uniqueness
  const existingUsers = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1)

  if (existingUsers.length > 0) {
    return { error: 'An account with this email already exists.' }
  }

  const passwordHash = await hashPassword(password)

  const [newUser] = await db
    .insert(users)
    .values({
      email: normalizedEmail,
      name: trimmedName,
      passwordHash,
    })
    .returning({ id: users.id })

  await db.insert(organizationMembers).values({
    orgId: invite.orgId,
    userId: newUser.id,
    role: invite.role,
  })

  // Mark token as used
  await db
    .update(inviteTokens)
    .set({ usedByUserId: newUser.id, usedAt: new Date() })
    .where(eq(inviteTokens.id, invite.id))

  await recordAudit({
    orgId: invite.orgId,
    userId: newUser.id,
    action: 'user.registered',
    resourceType: 'user',
    resourceId: newUser.id,
    details: { name: trimmedName, role: invite.role, invitePrefix: invite.tokenPrefix },
  })

  const { token, expiresAt } = await createSession(newUser.id)
  const cookieStore = await cookies()
  cookieStore.set(getSessionCookieConfig(token, expiresAt))

  redirect('/dashboard')
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

  if (sessionCookie?.value) {
    await deleteSession(sessionCookie.value)
  }

  cookieStore.delete(SESSION_COOKIE_NAME)

  redirect('/login')
}
