'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { suffix: '', label: 'Overview' },
  { suffix: '/deployments', label: 'Deployments' },
  { suffix: '/environments', label: 'Environments' },
  { suffix: '/routes', label: 'Routes' },
  { suffix: '/secrets', label: 'Secrets' },
  { suffix: '/integrations', label: 'Integrations' },
  { suffix: '/settings', label: 'Settings' },
]

export function ProjectNav({ slug }: { slug: string }) {
  const pathname = usePathname()
  const base = '/projects/' + slug
  return (
    <nav className="project-nav" aria-label="Project">
      {tabs.map((tab) => {
        const href = base + tab.suffix
        const active = tab.suffix === '' ? pathname === base : pathname === href || pathname.startsWith(href + '/')
        return (
          <Link key={href} className={active ? 'active' : ''} href={href} aria-current={active ? 'page' : undefined}>
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
