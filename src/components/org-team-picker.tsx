'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Building2, ChevronsUpDown, Check, Users } from 'lucide-react'
import { switchOrgAction } from '@/lib/auth-actions'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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

interface OrgTeamPickerProps {
  orgs: OrgEntry[]
  currentOrg: OrgEntry
  teams: TeamEntry[]
}

export function OrgTeamPicker({ orgs, currentOrg, teams }: OrgTeamPickerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  function handleOrgSwitch(orgId: string) {
    if (orgId === currentOrg.id) return
    setOpen(false)
    startTransition(async () => {
      await switchOrgAction(orgId)
      router.refresh()
    })
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className={cn(
          'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors',
          'hover:bg-sidebar-accent/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          isPending && 'opacity-60',
        )}
        disabled={isPending}
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Building2 className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 truncate">
          <p className="truncate text-sm font-medium text-sidebar-foreground">{currentOrg.name}</p>
          {teams.length > 0 && (
            <p className="truncate text-xs text-sidebar-muted">
              {teams.length} {teams.length === 1 ? 'team' : 'teams'}
            </p>
          )}
        </div>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-sidebar-muted" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-[220px]" sideOffset={6}>
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        {orgs.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onSelect={() => handleOrgSwitch(org.id)}
            className="gap-2"
          >
            <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate">{org.name}</span>
            {org.id === currentOrg.id && (
              <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
            )}
          </DropdownMenuItem>
        ))}

        {teams.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Your teams</DropdownMenuLabel>
            {teams.map((team) => (
              <DropdownMenuItem key={team.id} className="gap-2" disabled>
                <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">{team.name}</span>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
