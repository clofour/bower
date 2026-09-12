'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const tabs = [
  { label: 'Overview', href: '' },
  { label: 'Deployments', href: '/deployments' },
  { label: 'Environments', href: '/environments' },
  { label: 'Secrets', href: '/secrets' },
  { label: 'Routes', href: '/routes' },
  { label: 'Integrations', href: '/integrations' },
  { label: 'Settings', href: '/settings' },
]

export function ProjectTabs({ slug }: { slug: string }) {
  const pathname = usePathname()
  const base = `/projects/${slug}`

  return (
    <nav className="flex gap-6 border-b">
      {tabs.map((tab) => {
        const href = tab.href ? `${base}${tab.href}` : base
        const isActive =
          tab.href === ''
            ? pathname === base
            : pathname.startsWith(`${base}${tab.href}`)

        return (
          <Link
            key={tab.label}
            href={href}
            className={cn(
              'pb-2.5 pt-1 text-sm font-medium border-b-2 -mb-px transition-colors',
              isActive
                ? 'border-brand-500 text-ink'
                : 'border-transparent text-ink-muted hover:text-ink hover:border-ink-muted/50'
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
