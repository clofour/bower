declare global {
  var canopyDeploymentMonitor: NodeJS.Timeout | undefined
}

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs' || globalThis.canopyDeploymentMonitor) return
  const { reconcileAllDeployments } = await import('@/lib/deployment-reconciler')
  const seconds = Math.max(2, Number(process.env.CANOPY_RECONCILE_INTERVAL || 5))
  const reconcile = () => void reconcileAllDeployments().catch((error) => console.error('Canopy deployment reconciliation failed:', error))
  reconcile()
  globalThis.canopyDeploymentMonitor = setInterval(reconcile, seconds * 1000)
  globalThis.canopyDeploymentMonitor.unref()
}
