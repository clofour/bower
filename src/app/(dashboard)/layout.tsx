import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getUserOrganization } from '@/lib/queries'
import { Sidebar } from '@/components/sidebar'
import { Toaster } from '@/components/ui/toaster'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const orgCtx = await getUserOrganization(user.id)
  if (!orgCtx) redirect('/login')

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        user={{
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        }}
        role={orgCtx.role}
        organizationName={orgCtx.org.name}
      />
      <main id="main-content" className="min-h-screen pt-16 lg:ml-64 lg:pt-0">
        <div className="mx-auto max-w-[100rem] px-4 py-6 sm:px-6 lg:px-10 lg:py-9">{children}</div>
      </main>
      <Toaster />
    </div>
  )
}
