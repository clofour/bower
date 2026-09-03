'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { refreshDeploymentStatusesAction } from '@/lib/actions/services'

export function DeploymentPoller({ projectId, active }: { projectId: string; active: boolean }) {
  const router = useRouter()
  useEffect(() => {
    if (!active) return
    const poll = async () => { await refreshDeploymentStatusesAction(projectId); router.refresh() }
    const timer = window.setInterval(poll, 5000)
    return () => window.clearInterval(timer)
  }, [active, projectId, router])
  return null
}
