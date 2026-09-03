'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users, organizations, organizationMembers } from '@/db/schema'
import {
  hashPassword,
  verifyPassword,
  createSession,
  deleteSession,
  getSessionCookieConfig,
  SESSION_COOKIE_NAME,
} from '@/lib/auth'
import { verifyTotpCode } from '@/lib/totp'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 63) || 'org'
}

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

  const [newUser] = await db
    .insert(users)
    .values({
      email: normalizedEmail,
      name: trimmedName,
      passwordHash,
    })
    .returning({ id: users.id })

  const orgName = `${trimmedName}'s Organization`
  const [newOrg] = await db
    .insert(organizations)
    .values({
      name: orgName,
      slug: slugify(orgName),
      trellisApiUrl: '',
      trellisApiToken: '',
    })
    .returning({ id: organizations.id })

  await db.insert(organizationMembers).values({
    orgId: newOrg.id,
    userId: newUser.id,
    role: 'owner',
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
