'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Brand } from '@/components/brand'
import { OrgTeamPicker } from '@/components/org-team-picker'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { logoutAction } from '@/lib/auth-actions'
import {
  LayoutDashboard,
  FolderKanban,
  Server,
  Building2,
  Users,

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

interface OrgEntry {
  id: string
  name: string
  slug: string
  role: string
}

interface TeamEntry {
  id: string
  name: string
}

interface SidebarProps {
  user: {
    name: string
    email: string
    avatarUrl: string | null
  }
  orgs: OrgEntry[]
  currentOrg: OrgEntry
  teams: TeamEntry[]
}

export function Sidebar({ user, orgs, currentOrg, teams }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-[236px] flex-col border-r border-line bg-surface">
      {/* Brand */}
      <div className="flex h-14 shrink-0 items-center px-4">
        <Brand size="sm" />
      </div>

      {/* Org picker */}
      <div className="px-2 pb-1">
        <OrgTeamPicker orgs={orgs} currentOrg={currentOrg} teams={teams} />
      </div>

      {/* Navigation */}
      <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto px-2 pb-4 scroll-thin">
        <div className="space-y-0.5">
          {mainNav.map((item) => {
            const active = isActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] font-medium transition-colors duration-150',
                  active
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-ink-soft hover:bg-black/[0.035] hover:text-ink'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </div>

        {/* Settings section */}
        <div>
          <p className="px-2.5 pb-1.5 text-2xs font-semibold uppercase tracking-wide text-ink-faint">
            Settings
          </p>
          <div className="space-y-0.5">
            {settingsNav.map((item) => {
              const active = isActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] font-medium transition-colors duration-150',
                    active
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-ink-soft hover:bg-black/[0.035] hover:text-ink'
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      <Separator className="bg-line" />

      {/* User area */}
      <div className="shrink-0 p-2">
        <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2">
          <Avatar className="h-6 w-6">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
            <AvatarFallback className="bg-ink text-2xs font-semibold text-white">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-medium text-ink">{user.name}</p>
            <p className="truncate text-2xs text-ink-muted">{user.email}</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-md p-1.5 text-ink-muted transition-colors hover:bg-black/[0.035] hover:text-ink"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}
