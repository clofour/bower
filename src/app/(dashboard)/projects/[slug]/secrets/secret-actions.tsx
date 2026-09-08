'use client'

import { deleteSecretAction } from '@/lib/actions/operations'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

export function SecretActions({
  projectId,
  secretId,
}: {
  projectId: string
  secretId: string
}) {
  return (
    <form action={deleteSecretAction.bind(null, projectId, secretId)}>
      <Button variant="ghost" size="sm" type="submit" className="text-destructive hover:text-destructive">
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </form>
  )
}
