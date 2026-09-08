'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const primaryTabs = [
  { label: 'Overview', href: '' },
  { label: 'Deployments', href: '/deployments' },
  { label: 'Environments', href: '/environments' },
  { label: 'Routes', href: '/routes' },
]
const secondaryTabs = [
  { label: 'Secrets', href: '/secrets' },
  { label: 'Integrations', href: '/integrations' },
  { label: 'Settings', href: '/settings' },
]

export function ProjectTabs({ slug }: { slug: string }) {
  const pathname = usePathname()
  const base = `/projects/${slug}`

  return (
    <nav className="-mx-4 flex gap-1 overflow-x-auto border-b px-4 sm:mx-0 sm:px-0" aria-label="Project sections">
      {primaryTabs.map((tab) => {
        const href = tab.href ? `${base}${tab.href}` : base
        const isActive =
          tab.href === ''
            ? pathname === base
            : pathname.startsWith(`${base}${tab.href}`)

        return (
          <Link
            key={tab.label}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'pb-2.5 pt-1 text-sm font-medium border-b-2 -mb-px transition-colors',
              isActive
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'
            )}
          >
            {tab.label}
          </Link>
        )
      })}
      <DropdownMenu>
        <DropdownMenuTrigger className={cn('mb-[-1px] inline-flex items-center gap-1 border-b-2 px-1 pb-2.5 pt-1 text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring', secondaryTabs.some((tab) => pathname.startsWith(`${base}${tab.href}`)) ? 'border-primary text-foreground' : 'border-transparent')}>
          More <ChevronDown className="h-3.5 w-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {secondaryTabs.map((tab) => <DropdownMenuItem key={tab.href} asChild><Link href={`${base}${tab.href}`} aria-current={pathname.startsWith(`${base}${tab.href}`) ? 'page' : undefined}>{tab.label}</Link></DropdownMenuItem>)}
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  )
}
