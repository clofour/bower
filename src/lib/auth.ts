import { hash, compare } from 'bcryptjs'
import { randomUUID } from 'crypto'
import { cookies } from 'next/headers'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users, sessions } from '@/db/schema'
import type { User, Session } from '@/types/auth'

const BCRYPT_ROUNDS = 12
const SESSION_COOKIE_NAME = 'canopy_session'
const SESSION_DURATION_DAYS = 30

export async function hashPassword(password: string): Promise<string> {
  return hash(password, BCRYPT_ROUNDS)
}

export async function verifyPassword(
  password: string,
  hashValue: string
): Promise<boolean> {
  return compare(password, hashValue)
}

export function generateSessionToken(): string {
  return randomUUID()
}

export async function createSession(
  userId: string
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken()
  const now = new Date()
  const expiresAt = new Date(
    now.getTime() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000
  )

  await db.insert(sessions).values({
    id: randomUUID(),
    user_id: userId,
    token,
    expires_at: expiresAt,
    created_at: now,
  })

  return { token, expiresAt }
}

export async function validateSession(
  token: string
): Promise<{ user: User; session: Session } | null> {
  const sessionRows = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token))
    .limit(1)

  if (sessionRows.length === 0) {
    return null
  }

  const sessionRow = sessionRows[0]
  const now = new Date()

  if (new Date(sessionRow.expires_at) <= now) {
    await db.delete(sessions).where(eq(sessions.token, token))
    return null
  }

  const userRows = await db
    .select()
    .from(users)
    .where(eq(users.id, sessionRow.user_id))
    .limit(1)

  if (userRows.length === 0) {
    await db.delete(sessions).where(eq(sessions.token, token))
    return null
  }

  const userRow = userRows[0]

  const user: User = {
    id: userRow.id,
    email: userRow.email,
    name: userRow.name,
    avatarUrl: null,
    totpEnabled: userRow.totp_enabled,
    createdAt: new Date(userRow.created_at),
  }

  const session: Session = {
    id: sessionRow.id,
    userId: sessionRow.user_id,
    token: sessionRow.token,
    expiresAt: new Date(sessionRow.expires_at),
    createdAt: new Date(sessionRow.created_at),
  }

  return { user, session }
}

export async function deleteSession(token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.token, token))
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

  if (!sessionCookie?.value) {
    return null
  }

  const result = await validateSession(sessionCookie.value)
  return result?.user ?? null
}

export function getSessionCookieConfig(token: string, expiresAt: Date) {
  return {
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    expires: expiresAt,
  }
}

export { SESSION_COOKIE_NAME }
