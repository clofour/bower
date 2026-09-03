'use client'

import { useState, useTransition } from 'react'
import { Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { deployServiceAction } from '@/lib/actions/services'

export function DeployButton({
  serviceId,
  environmentId,
}: {
  serviceId: string
  environmentId: string
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDeploy() {
    setError(null)
    startTransition(async () => {
      const result = await deployServiceAction(serviceId, environmentId)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Rocket className="mr-1.5 h-3.5 w-3.5" />
          Deploy
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Trigger Deployment</AlertDialogTitle>
          <AlertDialogDescription>
            This will deploy the current image configuration to the selected
            environment. The deployment will be submitted to Trellis.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeploy} disabled={isPending}>
            {isPending ? 'Deploying...' : 'Deploy Now'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
