import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/shell'
import { getCurrentUser } from '@/lib/auth'
import { getUserOrganization } from '@/lib/queries'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const context = await getUserOrganization(user.id)
  if (!context) redirect('/login')

  return (
    <AppShell user={user} org={context.org} role={context.role}>
      {children}
    </AppShell>
  )
}
