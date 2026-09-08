'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Activity,
  Boxes,
  Building2,
  FileClock,
  FolderKanban,
  LayoutDashboard,
  Settings2,
  Users,
} from 'lucide-react'

const primary = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/cluster', label: 'Cluster', icon: Activity },
]

const settings = [
  { href: '/settings/account', label: 'Account', icon: Settings2 },
  { href: '/settings/organization', label: 'Organization', icon: Building2 },
  { href: '/settings/teams', label: 'Teams', icon: Users },
  { href: '/settings/audit', label: 'Audit log', icon: FileClock },
  { href: '/settings/templates', label: 'Templates', icon: Boxes },
]

function isCurrent(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/dashboard'
  if (href === '/projects') return pathname === '/projects' || pathname.startsWith('/projects/')
  return pathname === href || pathname.startsWith(href + '/')
}

function LinkRow({ href, label, Icon }: { href: string; label: string; Icon: typeof Activity }) {
  const pathname = usePathname()
  const active = isCurrent(pathname, href)
  return (
    <Link className={'nav-link' + (active ? ' active' : '')} href={href} aria-current={active ? 'page' : undefined}>
      <Icon aria-hidden="true" />
      <span>{label}</span>
    </Link>
  )
}

export function Navigation() {
  return (
    <>
      <div className="nav-section-label">Workspace</div>
      <nav className="nav-list" aria-label="Workspace">
        {primary.map((item) => <LinkRow key={item.href} href={item.href} label={item.label} Icon={item.icon} />)}
      </nav>
      <div className="nav-section-label">Settings</div>
      <nav className="nav-list" aria-label="Settings">
        {settings.map((item) => <LinkRow key={item.href} href={item.href} label={item.label} Icon={item.icon} />)}
      </nav>
    </>
  )
}
