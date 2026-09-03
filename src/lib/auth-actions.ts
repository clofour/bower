'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { randomUUID } from 'crypto'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users, organizations, organization_members } from '@/db/schema'
import {
  hashPassword,
  verifyPassword,
  createSession,
  deleteSession,
  getSessionCookieConfig,
  SESSION_COOKIE_NAME,
} from '@/lib/auth'

export async function loginAction(
  formData: FormData
): Promise<{ error?: string }> {
  const email = formData.get('email')
  const password = formData.get('password')

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
  const passwordValid = await verifyPassword(password, user.password_hash)

  if (!passwordValid) {
    return { error: 'Invalid email or password.' }
  }

  const { token, expiresAt } = await createSession(user.id)
  const cookieStore = await cookies()
  cookieStore.set(getSessionCookieConfig(token, expiresAt))

  redirect('/projects')
}

export async function registerAction(
  formData: FormData
): Promise<{ error?: string }> {
  const email = formData.get('email')
  const password = formData.get('password')
  const name = formData.get('name')

  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    typeof name !== 'string' ||
    !email ||
    !password ||
    !name
  ) {
    return { error: 'Name, email, and password are required.' }
  }

  const normalizedEmail = email.toLowerCase().trim()
  const trimmedName = name.trim()

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }

  const existingUsers = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1)

  if (existingUsers.length > 0) {
    return { error: 'An account with this email already exists.' }
  }

  const passwordHash = await hashPassword(password)
  const userId = randomUUID()
  const now = new Date()

  await db.insert(users).values({
    id: userId,
    email: normalizedEmail,
    name: trimmedName,
    password_hash: passwordHash,
    totp_secret: null,
    totp_enabled: false,
    created_at: now,
    updated_at: now,
  })

  const orgId = randomUUID()

  await db.insert(organizations).values({
    id: orgId,
    name: `${trimmedName}'s Organization`,
    created_at: now,
    updated_at: now,
  })

  await db.insert(organization_members).values({
    id: randomUUID(),
    organization_id: orgId,
    user_id: userId,
    role: 'owner',
    created_at: now,
  })

  const { token, expiresAt } = await createSession(userId)
  const cookieStore = await cookies()
  cookieStore.set(getSessionCookieConfig(token, expiresAt))

  redirect('/projects')
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
