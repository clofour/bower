'use client'

import { useState } from 'react'
import { setSecretAction } from '@/lib/actions/operations'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus } from 'lucide-react'

export function CreateSecretDialog({
  projectId,
  environments,
}: {
  projectId: string
  environments: { id: string; name: string }[]
}) {
  const [open, setOpen] = useState(false)

  async function handleSubmit(formData: FormData) {
    await setSecretAction(projectId, formData)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Secret
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Secret</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="environmentId">Environment</Label>
            <Select name="environmentId" required>
              <SelectTrigger>
                <SelectValue placeholder="Select environment" />
              </SelectTrigger>
              <SelectContent>
                {environments.map((env) => (
                  <SelectItem key={env.id} value={env.id}>
                    {env.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="MY_SECRET_KEY"
              required
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="value">Value</Label>
            <Textarea
              id="value"
              name="value"
              placeholder="Secret value"
              required
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sharedName">Shared Group (optional)</Label>
            <Input
              id="sharedName"
              name="sharedName"
              placeholder="e.g. database-credentials"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save Secret</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
