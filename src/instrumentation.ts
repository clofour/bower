declare global {
  var canopyDeploymentMonitor: NodeJS.Timeout | undefined
}

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs' || globalThis.canopyDeploymentMonitor) return
  const { reconcileAllDeployments } = await import('@/lib/deployment-reconciler')
  const seconds = Math.max(2, Number(process.env.CANOPY_RECONCILE_INTERVAL || 5))
  void reconcileAllDeployments()
  globalThis.canopyDeploymentMonitor = setInterval(() => void reconcileAllDeployments(), seconds * 1000)
  globalThis.canopyDeploymentMonitor.unref()
}
