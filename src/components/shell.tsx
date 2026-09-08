import type { ReactNode } from 'react'
import { Brand } from '@/components/brand'
import { Navigation } from '@/components/nav'
import { logoutAction } from '@/lib/auth-actions'

export function AppShell({
  children,
  user,
  org,
  role,
}: {
  children: ReactNode
  user: { name: string; email: string }
  org: { name: string }
  role: string
}) {
  return (
    <div className="app-frame">
      <aside className="sidebar">
        <Brand light />
        <Navigation />
        <div className="sidebar-spacer" />
        <div className="sidebar-user">
          <div className="sidebar-user-name">{user.name}</div>
          <div className="sidebar-user-meta">{org.name} · {role}</div>
          <form action={logoutAction}>
            <button className="sidebar-signout" type="submit">Sign out</button>
          </form>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-title">{org.name}</div>
          <div className="topbar-cluster">Trellis control plane</div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  )
}
