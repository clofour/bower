import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { ORG_COOKIE_NAME } from '@/lib/constants'
import { getUserOrganizations, getUserOrganization, getUserTeams } from '@/lib/queries'
import { Sidebar } from '@/components/sidebar'
import { HeaderBar } from '@/components/header-bar'
import { Toaster } from '@/components/ui/toaster'

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

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
    <div className="flex min-h-screen w-full bg-canvas">
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
      <div className="ml-[236px] flex min-w-0 flex-1 flex-col">
        <HeaderBar userInitials={getInitials(user.name)} />
        <main className="min-w-0 flex-1 px-6 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
      <Toaster />
    </div>
  )
}
