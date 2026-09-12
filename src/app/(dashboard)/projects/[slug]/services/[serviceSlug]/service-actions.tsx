'use client'

import { useTransition } from 'react'
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

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="default"
        size="sm"
        disabled={isLocked || restarting}
        onClick={() => startRestart(() => restartServiceAction(serviceId, environmentId))}
      >
        <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${restarting ? 'animate-spin' : ''}`} />
        Restart
      </Button>
      <Button
        variant="primary"
        size="sm"
        disabled={isLocked || deploying}
        onClick={() => startDeploy(() => deployServiceAction(serviceId, environmentId))}
      >
        <Rocket className="mr-1.5 h-3.5 w-3.5" />
        {deploying ? 'Deploying...' : 'Deploy'}
      </Button>
    </div>
  )
}
