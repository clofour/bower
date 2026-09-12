'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import {
  Search,
  FolderKanban,
  Server,
  Activity,
  CornerDownLeft,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchEntry {
  id: string
  label: string
  hint: string
  href: string
  kind: 'project' | 'service' | 'page'
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projects: { id: string; name: string; slug: string; teamName?: string }[]
  services: { id: string; name: string; slug: string; type: string; projectName: string; projectSlug: string }[]
  orgName: string
}

const pages: SearchEntry[] = [
  { id: 'pg-overview', label: 'Overview', hint: 'Page', href: '/dashboard', kind: 'page' },
  { id: 'pg-projects', label: 'Projects', hint: 'Page', href: '/projects', kind: 'page' },
  { id: 'pg-deploys', label: 'Deployments', hint: 'Page', href: '/deployments', kind: 'page' },
  { id: 'pg-status', label: 'Status', hint: 'Page', href: '/status', kind: 'page' },
  { id: 'pg-settings', label: 'Settings', hint: 'Page', href: '/settings', kind: 'page' },
]

const kindIcon = {
  project: FolderKanban,
  service: Server,
  page: Activity,
} as const

export function CommandPalette({ open, onOpenChange, projects, services, orgName }: CommandPaletteProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const entries = useMemo<SearchEntry[]>(() => {
    const projectEntries: SearchEntry[] = projects.map((p) => ({
      id: p.id,
      label: p.name,
      hint: p.teamName ? `Project · ${p.teamName}` : 'Project',
      href: `/projects/${p.slug}`,
      kind: 'project',
    }))
    const serviceEntries: SearchEntry[] = services.map((s) => ({
      id: s.id,
      label: s.name,
      hint: `${s.type} service · ${s.projectName}`,
      href: `/projects/${s.projectSlug}/services/${s.slug}`,
      kind: 'service',
    }))
    return [...projectEntries, ...serviceEntries, ...pages]
  }, [projects, services])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return entries.slice(0, 8)
    return entries
      .filter((e) => `${e.label} ${e.hint}`.toLowerCase().includes(q))
      .slice(0, 10)
  }, [entries, query])

  const scrollActiveIntoView = useCallback((index: number) => {
    const active = listRef.current?.children[index] as HTMLElement | undefined
    active?.scrollIntoView({ block: 'nearest' })
  }, [])

  const go = useCallback(
    (href: string) => {
      router.push(href)
      onOpenChange(false)
    },
    [router, onOpenChange],
  )

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setCursor((c) => {
          const next = Math.min(results.length - 1, c + 1)
          scrollActiveIntoView(next)
          return next
        })
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setCursor((c) => {
          const next = Math.max(0, c - 1)
          scrollActiveIntoView(next)
          return next
        })
      } else if (e.key === 'Enter' && results[cursor]) {
        e.preventDefault()
        go(results[cursor].href)
      }
    },
    [results, cursor, go, scrollActiveIntoView],
  )

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/25 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-label="Search Bower"
          onKeyDown={onKeyDown}
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            setQuery('')
            setCursor(0)
            inputRef.current?.focus()
          }}
          className="fixed left-[50%] top-[12vh] z-50 w-full max-w-lg translate-x-[-50%] overflow-hidden rounded-xl border border-line bg-surface shadow-pop duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-[0.98] data-[state=open]:zoom-in-[0.97] data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2"
        >
          <DialogPrimitive.Title className="sr-only">Search</DialogPrimitive.Title>
          <div className="flex items-center gap-2.5 border-b border-line px-4">
            <Search className="h-4 w-4 shrink-0 text-ink-faint" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setCursor(0)
              }}
              placeholder="Search projects, services, pages…"
              aria-label="Search projects, services, pages"
              className="h-12 w-full bg-transparent text-[14px] text-ink placeholder:text-ink-faint focus:outline-none"
            />
            <kbd className="shrink-0 rounded border border-line bg-sunken px-1.5 py-0.5 text-2xs text-ink-muted">
              ESC
            </kbd>
          </div>

          <ul
            ref={listRef}
            className="max-h-72 overflow-y-auto p-1.5 scroll-thin"
            role="listbox"
            aria-label="Results"
          >
            {results.map((entry, i) => {
              const Icon = kindIcon[entry.kind]
              const active = i === cursor
              return (
                <li key={entry.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => go(entry.href)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors duration-150',
                      active ? 'bg-brand-50' : 'hover:bg-sunken',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-ink-muted" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-ink">
                        {entry.label}
                      </span>
                      <span className="block truncate text-xs capitalize text-ink-muted">
                        {entry.hint}
                      </span>
                    </span>
                    {active && (
                      <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-brand-500" />
                    )}
                  </button>
                </li>
              )
            })}
            {results.length === 0 && (
              <li className="px-3 py-6 text-center text-[13px] text-ink-muted">
                Nothing matches &ldquo;{query}&rdquo;.
              </li>
            )}
          </ul>

          <div className="flex items-center justify-between border-t border-line bg-sunken px-4 py-2 text-2xs text-ink-muted">
            <span className="flex items-center gap-1.5">
              <Users className="h-3 w-3" />
              Scoped to {orgName}
            </span>
            <span>&uarr;&darr; to move &middot; &crarr; to open</span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
