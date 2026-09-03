import { redirect } from 'next/navigation'
import { Server, AlertTriangle, Cpu, MemoryStick } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { getUserOrganization } from '@/lib/queries'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getTrellisClient } from '@/lib/trellis-instance'
import type { TrellisNode } from '@/types/trellis'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(0)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(0)} MB`
  const gb = mb / 1024
  return `${gb.toFixed(1)} GB`
}

function formatCpu(millicores: number): string {
  if (millicores < 1000) return `${millicores}m`
  return `${(millicores / 1000).toFixed(1)} CPU`
}

const statusColors: Record<string, string> = {
  healthy: 'bg-green-500/10 text-green-600 dark:text-green-400',
  unhealthy: 'bg-red-500/10 text-red-600 dark:text-red-400',
  draining: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
}

export default async function ClusterPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const ctx = await getUserOrganization(user.id)
  if (!ctx) redirect('/login')

  const isTrellisConfigured = !!(ctx.org.trellisApiUrl && ctx.org.trellisApiToken)

  let nodes: TrellisNode[] = []
  let error: string | null = null

  if (isTrellisConfigured) {
    try {
      const client = await getTrellisClient(ctx.org.id)
      nodes = await client.listNodes()
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to connect to Trellis.'
    }
  }

  const totalCpu = nodes.reduce((acc, n) => acc + n.cpu, 0)
  const usedCpu = nodes.reduce((acc, n) => acc + n.cpu_used, 0)
  const totalMem = nodes.reduce((acc, n) => acc + n.memory, 0)
  const usedMem = nodes.reduce((acc, n) => acc + n.memory_used, 0)

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Cluster</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and manage Trellis cluster nodes
        </p>
      </div>

      {!isTrellisConfigured ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Trellis not configured</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure Trellis API credentials in Organization Settings to view
            cluster status.
          </p>
        </Card>
      ) : error ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Connection error</h3>
          <p className="mt-1 max-w-md text-center text-sm text-muted-foreground">
            {error}
          </p>
        </Card>
      ) : (
        <>
          {nodes.length > 0 && (
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Nodes</p>
                <p className="mt-1 text-2xl font-bold">{nodes.length}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">CPU Usage</p>
                <p className="mt-1 text-2xl font-bold">
                  {formatCpu(usedCpu)}{' '}
                  <span className="text-sm font-normal text-muted-foreground">
                    / {formatCpu(totalCpu)}
                  </span>
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Memory Usage</p>
                <p className="mt-1 text-2xl font-bold">
                  {formatBytes(usedMem)}{' '}
                  <span className="text-sm font-normal text-muted-foreground">
                    / {formatBytes(totalMem)}
                  </span>
                </p>
              </Card>
            </div>
          )}

          <div className="space-y-3">
            {nodes.map((node) => {
              const cpuPercent =
                node.cpu > 0 ? Math.round((node.cpu_used / node.cpu) * 100) : 0
              const memPercent =
                node.memory > 0
                  ? Math.round((node.memory_used / node.memory) * 100)
                  : 0

              return (
                <Card key={node.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                        <Server className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium font-mono text-sm">
                            {node.address}
                          </h3>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[node.status] ?? ''}`}
                          >
                            {node.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {node.os}/{node.arch} &middot; v{node.version}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>CPU</span>
                        <span>{cpuPercent}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted">
                        <div
                          className="h-1.5 rounded-full bg-primary transition-all"
                          style={{ width: `${cpuPercent}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Memory</span>
                        <span>{memPercent}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted">
                        <div
                          className="h-1.5 rounded-full bg-primary transition-all"
                          style={{ width: `${memPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
