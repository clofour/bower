'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const tabs = [
  { label: 'Organization', href: '/settings/organization' },
  { label: 'Teams', href: '/settings/teams' },
  { label: 'Cluster', href: '/settings/cluster' },
]

export function SettingsNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1 overflow-x-auto border-b border-line scroll-thin">
      {tabs.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(tab.href + '/')
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'relative whitespace-nowrap px-3 py-2.5 text-[13px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300',
              active
                ? 'text-ink after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full after:bg-brand-500'
                : 'text-ink-muted hover:text-ink'
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
