'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { Brand } from '@/components/brand'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { logoutAction } from '@/lib/auth-actions'
import {
  LayoutDashboard,
  FolderKanban,
  Server,
  Building2,
  Users,
  BookTemplate,
  ScrollText,
  UserCircle,
  LogOut,
  Menu,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const mainNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
  { label: 'Cluster', href: '/cluster', icon: Server },
]

const settingsNav: NavItem[] = [
  { label: 'Organization', href: '/settings/organization', icon: Building2 },
  { label: 'Teams', href: '/settings/teams', icon: Users },
  { label: 'Templates', href: '/settings/templates', icon: BookTemplate },
  { label: 'Audit log', href: '/settings/audit', icon: ScrollText },
  { label: 'Account', href: '/settings/account', icon: UserCircle },
]

function isActive(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname === href || pathname.startsWith(href + '/')
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

interface SidebarProps {
  user: {
    name: string
    email: string
    avatarUrl: string | null
  }
  role: 'owner' | 'admin' | 'member'
  organizationName: string
}

export function Sidebar({ user, role, organizationName }: SidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <a href="#main-content" className="fixed left-3 top-3 z-[60] -translate-y-20 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground focus:translate-y-0">Skip to content</a>
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-sidebar-border bg-sidebar px-4 lg:hidden">
        <Brand size="sm" className="text-white" />
        <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
          <DialogTrigger asChild><button type="button" className="flex h-10 w-10 items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent" aria-label="Open navigation"><Menu className="h-5 w-5" /></button></DialogTrigger>
          <DialogContent className="bottom-0 left-0 top-0 h-dvh max-w-[19rem] translate-x-0 translate-y-0 content-start gap-0 overflow-y-auto rounded-none border-y-0 border-l-0 bg-sidebar p-0 text-sidebar-foreground data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left">
            <DialogTitle className="sr-only">Navigation</DialogTitle><DialogDescription className="sr-only">Navigate Bower and access your account.</DialogDescription>
            <div className="flex h-16 items-center border-b border-sidebar-border px-5"><Brand size="sm" /></div>
            <Context organizationName={organizationName} role={role} />
            <div className="px-3"><Navigation pathname={pathname} role={role} onNavigate={() => setMobileOpen(false)} /></div>
            <div className="mt-auto"><UserArea user={user} /></div>
          </DialogContent>
        </Dialog>
      </header>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex" aria-label="Primary navigation">
      <div className="flex h-16 items-center px-5">
        <Brand size="sm" className="text-sidebar-foreground" />
      </div>

      <Separator className="bg-sidebar-border" />

      <Context organizationName={organizationName} role={role} />
      <ScrollArea className="flex-1 px-3 py-2">
        <Navigation pathname={pathname} role={role} />
      </ScrollArea>
      <Separator className="bg-sidebar-border" />
      <UserArea user={user} />
      </aside>
    </>
  )
}

function Context({ organizationName, role }: { organizationName: string; role: SidebarProps['role'] }) {
  return <div className="px-5 py-4"><p className="truncate text-sm font-medium text-white">{organizationName}</p><p className="mt-0.5 text-xs capitalize text-sidebar-muted">Organization · {role}</p></div>
}

function Navigation({ pathname, role, onNavigate }: { pathname: string; role: SidebarProps['role']; onNavigate?: () => void }) {
  const visibleSettings = role === 'member' ? settingsNav.filter((item) => item.href === '/settings/account') : settingsNav
  return <nav className="flex flex-col gap-1" aria-label="Workspace">
          <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-[.16em] text-sidebar-muted">Operate</p>
          {mainNav.map((item) => {
            const active = isActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}

          {/* Settings section */}
          <p className="mb-1 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-muted">
            Settings
          </p>
          {visibleSettings.map((item) => {
            const active = isActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>
}

function UserArea({ user }: { user: SidebarProps['user'] }) {
  return <div className="mt-3 flex items-center gap-3 border-t border-sidebar-border px-3 py-4 lg:mt-0 lg:border-0 lg:px-4 lg:py-3">
        <Avatar className="h-8 w-8">
          {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
          <AvatarFallback className="bg-sidebar-accent text-xs text-sidebar-accent-foreground">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 truncate">
          <p className="truncate text-sm font-medium text-sidebar-foreground">{user.name}</p>
          <p className="truncate text-xs text-sidebar-muted">{user.email}</p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-md p-1.5 text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            title="Sign out" aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
}
