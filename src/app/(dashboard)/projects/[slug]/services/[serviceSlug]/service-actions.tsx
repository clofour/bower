'use client'

import { useState, useTransition } from 'react'
import { deployServiceAction, restartServiceAction } from '@/lib/actions/services'
import { Button } from '@/components/ui/button'
import { Rocket, RefreshCw } from 'lucide-react'

interface ServiceActionsProps {
  serviceId: string
  environmentId: string
  isLocked: boolean
  replicas: number
}

export function ServiceActions({ serviceId, environmentId, isLocked }: ServiceActionsProps) {
  const [deploying, startDeploy] = useTransition()
  const [restarting, startRestart] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const run = (start: (callback: () => Promise<void>) => void, operation: () => Promise<void>) => {
    setError(null)
    start(async () => { try { await operation() } catch { setError('Operation failed. Check the Trellis connection and try again.') } })
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={isLocked || restarting}
        onClick={() => run(startRestart, () => restartServiceAction(serviceId, environmentId))}
      >
        <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${restarting ? 'animate-spin' : ''}`} />
        Restart
      </Button>
      <Button
        size="sm"
        disabled={isLocked || deploying}
        onClick={() => run(startDeploy, () => deployServiceAction(serviceId, environmentId))}
      >
        <Rocket className="mr-1.5 h-3.5 w-3.5" />
        {deploying ? 'Deploying…' : 'Deploy'}
      </Button>
      {isLocked && <span className="w-full text-right text-xs text-muted-foreground">Unlock this environment to operate the service.</span>}
      {error && <span role="alert" className="w-full text-right text-xs text-destructive">{error}</span>}
    </div>
  )
}
