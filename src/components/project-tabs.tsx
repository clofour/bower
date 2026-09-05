'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const tabs = [
  { label: 'Services', href: '' },
  { label: 'Environments', href: '/environments' },
  { label: 'Routes', href: '/routes' },
  { label: 'Secrets', href: '/secrets' },
  { label: 'Deployments', href: '/deployments' },
  { label: 'Integrations', href: '/integrations' },
  { label: 'Settings', href: '/settings' },
]

export function ProjectTabs({ slug }: { slug: string }) {
  const pathname = usePathname()
  const base = `/projects/${slug}`

  return (
    <div className="border-b border-border">
      <nav className="-mb-px flex gap-6" aria-label="Project tabs">
        {tabs.map((tab) => {
          const href = `${base}${tab.href}`
          const isActive =
            tab.href === ''
              ? pathname === base || pathname === `${base}/`
              : pathname.startsWith(href)

          return (
            <Link
              key={tab.label}
              href={href}
              className={cn(
                'border-b-[1.5px] pb-3 pt-1 text-sm font-medium transition-colors',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
