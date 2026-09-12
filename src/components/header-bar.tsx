'use client'

import { usePathname } from 'next/navigation'
import { Search } from 'lucide-react'

const titleMap: Record<string, string> = {
  '/dashboard': 'Overview',
  '/projects': 'Projects',
  '/deployments': 'Deployments',
  '/status': 'Status',
  '/settings': 'Settings',
  '/settings/organization': 'Organization',
  '/settings/teams': 'Teams',
  '/settings/cluster': 'Cluster',
  '/settings/audit': 'Audit log',
  '/settings/account': 'Account',
}

function deriveTitle(pathname: string) {
  if (titleMap[pathname]) return titleMap[pathname]
  const segments = pathname.split('/').filter(Boolean)
  const last = segments[segments.length - 1] || 'Overview'
  return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ')
}

export function HeaderBar() {
  const pathname = usePathname()
  const title = deriveTitle(pathname)

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-canvas/85 px-6 backdrop-blur-md">
      <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink">
        {title}
      </span>

      <button
        type="button"
        className="flex h-8 items-center gap-2 rounded-lg border border-line bg-surface px-2.5 text-[12.5px] text-ink-muted shadow-card transition-colors duration-150 hover:border-line-strong hover:text-ink"
      >
        <Search className="h-3.5 w-3.5" />
        Search
        <kbd className="ml-3 rounded border border-line bg-sunken px-1.5 py-px font-sans text-2xs">
          ⌘K
        </kbd>
      </button>
    </header>
  )
}
