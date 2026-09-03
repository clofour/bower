'use client'

import { useState, useTransition } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createServiceAction } from '@/lib/actions/services'

type Template = { name: string; type: 'web' | 'worker' | 'cron' | 'custom'; config: Record<string, unknown> }

export function CreateServiceDialog({ projectSlug, templates = [] }: { projectSlug: string; templates?: Template[] }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [templateIndex, setTemplateIndex] = useState('')
  const selected = templateIndex ? templates[Number(templateIndex)] : undefined

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await createServiceAction(projectSlug, formData)
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
          New Service
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Service</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          {templates.length > 0 && <div className="space-y-2"><Label>Starting point</Label><select value={templateIndex} onChange={(event) => setTemplateIndex(event.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Blank service</option>{templates.map((template, index) => <option key={`${template.name}-${index}`} value={index}>{template.name}</option>)}</select><input type="hidden" name="templateConfig" value={selected ? JSON.stringify(selected.config) : ''} /></div>}
          <div className="space-y-2">
            <Label htmlFor="service-name">Name</Label>
            <Input
              id="service-name"
              name="name"
              placeholder="api-server"
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="service-type">Type</Label>
            <Select key={`type-${templateIndex}`} name="type" defaultValue={selected?.type ?? 'web'}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="web">Web</SelectItem>
                <SelectItem value="worker">Worker</SelectItem>
                <SelectItem value="cron">Cron</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="service-image">Container Image</Label>
            <Input
              key={`image-${templateIndex}`}
              id="service-image"
              name="image"
              placeholder="registry.example.com/my-app:latest"
              defaultValue={typeof selected?.config.image === 'string' ? selected.config.image : ''}
              required
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
              {isPending ? 'Creating...' : 'Create Service'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
