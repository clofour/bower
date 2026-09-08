'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Brand } from '@/components/brand'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
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
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Brand */}
      <div className="flex h-14 items-center px-5">
        <Brand size="sm" className="text-sidebar-foreground" />
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {mainNav.map((item) => {
            const active = isActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
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
          {settingsNav.map((item) => {
            const active = isActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
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
      </ScrollArea>

      <Separator className="bg-sidebar-border" />

      {/* User area */}
      <div className="flex items-center gap-3 px-4 py-3">
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
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
    </aside>
  )
}
