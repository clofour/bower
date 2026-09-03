'use client'

import { useState, useTransition } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { createProjectAction } from '@/lib/actions/projects'
import { NoopButton } from '@/components/noop-button'

export function CreateProjectDialog({ teams = [] }: { teams?: Array<{ id: string; name: string }> }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await createProjectAction(formData)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Name</Label>
            <Input
              id="project-name"
              name="name"
              placeholder="my-app"
              required
              autoFocus
            />
          </div>
          <div className="space-y-2"><Label htmlFor="registry-url">Container registry (optional)</Label><Input id="registry-url" name="registryUrl" placeholder="ghcr.io/organization" /></div>
          <div className="space-y-2"><Label>Owning team</Label><select name="owningTeamId" className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">No owning team</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></div>
          <NoopButton feature="Authenticated registry pull-through" className="w-full">Add registry credentials</NoopButton>
          <div className="space-y-2">
            <Label htmlFor="project-description">Description (optional)</Label>
            <Textarea
              id="project-description"
              name="description"
              placeholder="A brief description of the project"
              rows={3}
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
