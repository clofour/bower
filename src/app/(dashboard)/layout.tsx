import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { ORG_COOKIE_NAME } from '@/lib/auth-actions'
import { getUserOrganizations, getUserOrganization, getUserTeams } from '@/lib/queries'
import { Sidebar } from '@/components/sidebar'
import { Toaster } from '@/components/ui/toaster'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const preferredOrgId = cookieStore.get(ORG_COOKIE_NAME)?.value ?? null

  const allOrgs = await getUserOrganizations(user.id)
  if (allOrgs.length === 0) redirect('/login')

  const orgCtx = await getUserOrganization(user.id, preferredOrgId)
  if (!orgCtx) redirect('/login')

  const teams = await getUserTeams(user.id, orgCtx.org.id)

  const orgs = allOrgs.map((entry) => ({
    id: entry.org.id,
    name: entry.org.name,
    slug: entry.org.slug,
    role: entry.role,
  }))

  const currentOrg = {
    id: orgCtx.org.id,
    name: orgCtx.org.name,
    slug: orgCtx.org.slug,
    role: orgCtx.role,
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        user={{
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        }}
        orgs={orgs}
        currentOrg={currentOrg}
        teams={teams}
      />
      <main className="ml-60 min-h-screen">
        <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
      </main>
      <Toaster />
    </div>
  )
}
