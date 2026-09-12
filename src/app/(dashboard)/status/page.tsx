import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import {
  getUserOrganization,
  getManagedProxiesForOrg,
  getRouteCountsByEnvironment,
} from '@/lib/queries'
import { getTrellisClient } from '@/lib/trellis-instance'
import { PageHeading } from '@/components/page-heading'
import { Panel, PanelHeader, KeyValue } from '@/components/ui/panel'
import { Chip, Dot, Meter, Mono, StatusDot } from '@/components/status'
import { EmptyState, InlineNotice } from '@/components/ui/empty-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Server } from 'lucide-react'
import { DrainToggle } from '../cluster/drain-toggle'
import type { TrellisNode } from '@/types/trellis'

function formatCpu(millicores: number) {
  if (millicores >= 1000) return `${(millicores / 1000).toFixed(1)}`
  return `${(millicores / 1000).toFixed(2)}`
}

function formatMemGiB(bytes: number) {
  return (bytes / (1024 * 1024 * 1024)).toFixed(1)
}

function relTime(date: Date): string {
  const now = Date.now()
  const diff = now - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default async function StatusPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const orgCtx = await getUserOrganization(user.id)
  if (!orgCtx) redirect('/login')

  let nodes: TrellisNode[] = []
  let clusterError: string | null = null
  let clusterUrl: string | null = null

  try {
    const client = await getTrellisClient(orgCtx.org.id)
    nodes = await client.listNodes()
    clusterUrl = orgCtx.org.trellisApiUrl?.replace(/^https?:\/\//, '').replace(/\/+$/, '') ?? null
  } catch (err) {
    clusterError = err instanceof Error ? err.message : 'Failed to connect to cluster.'
  }

  const [proxies, routeCounts] = await Promise.all([
    getManagedProxiesForOrg(orgCtx.org.id),
    getRouteCountsByEnvironment(orgCtx.org.id),
  ])

  const routeCountMap = new Map(routeCounts.map((r) => [r.environmentId, r.count]))

  const healthyNodes = nodes.filter((n) => n.status === 'healthy').length
  const totalCpu = nodes.reduce((sum, n) => sum + n.cpu, 0)
  const usedCpu = nodes.reduce((sum, n) => sum + (n.cpu_used ?? 0), 0)
  const totalMem = nodes.reduce((sum, n) => sum + n.memory, 0)
  const usedMem = nodes.reduce((sum, n) => sum + (n.memory_used ?? 0), 0)
  const cpuPct = totalCpu > 0 ? Math.round((usedCpu / totalCpu) * 100) : 0
  const memPct = totalMem > 0 ? Math.round((usedMem / totalMem) * 100) : 0

  if (clusterError) {
    return (
      <div className="space-y-6">
        <PageHeading
          title="Cluster"
          description="Bower talks to one Trellis cluster. Scheduling, placement, and container lifecycle stay entirely with Trellis."
        />
        <EmptyState
          icon={<Server className="h-4 w-4" />}
          title="Unable to reach cluster"
          body={clusterError}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow={
          <Chip tone="brand">
            <Dot tone="brand" />
            connected
          </Chip>
        }
        title="Cluster"
        description="Bower talks to one Trellis cluster. Scheduling, placement, and container lifecycle stay entirely with Trellis."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel>
          <PanelHeader title="Connection" hint={clusterUrl ?? undefined} />
          <dl className="divide-y divide-line px-4">
            <KeyValue label="Control-plane API" mono>
              {orgCtx.org.trellisApiUrl ?? '—'}
            </KeyValue>
            <KeyValue label="Nodes online">
              {healthyNodes} / {nodes.length}
            </KeyValue>
          </dl>
        </Panel>

        <Panel>
          <PanelHeader title="Capacity" hint={`${nodes.length} node${nodes.length === 1 ? '' : 's'}`} />
          <div className="space-y-4 p-4">
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] text-ink-soft">CPU</span>
                <span className="nums text-[13px] text-ink">
                  {formatCpu(usedCpu)} / {formatCpu(totalCpu)} cores
                </span>
              </div>
              <div className="mt-2">
                <Meter value={cpuPct} label="Cluster CPU" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] text-ink-soft">Memory</span>
                <span className="nums text-[13px] text-ink">
                  {formatMemGiB(usedMem)} / {formatMemGiB(totalMem)} GiB
                </span>
              </div>
              <div className="mt-2">
                <Meter value={memPct} label="Cluster memory" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-line pt-4">
              <div>
                <p className="text-xs text-ink-muted">Managed proxies</p>
                <p className="nums mt-1 text-xl font-semibold tracking-tight text-ink">
                  {proxies.length}
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">Healthy nodes</p>
                <p className="nums mt-1 text-xl font-semibold tracking-tight text-ink">
                  {healthyNodes}
                </p>
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelHeader title="Nodes" hint="Raft consensus elects one leader to serve the control-plane API" />
        {nodes.length === 0 ? (
          <EmptyState
            icon={<Server className="h-4 w-4" />}
            title="No nodes"
            body="No nodes are registered with the Trellis cluster."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Node</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>CPU</TableHead>
                <TableHead>Memory</TableHead>
                <TableHead>Arch</TableHead>
                <TableHead>Version</TableHead>
                <TableHead className="text-right">Drain</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nodes.map((node) => {
                const nodeCpuPct = node.cpu > 0 ? Math.round(((node.cpu_used ?? 0) / node.cpu) * 100) : 0
                const nodeMemPct = node.memory > 0 ? Math.round(((node.memory_used ?? 0) / node.memory) * 100) : 0
                return (
                  <TableRow key={node.id}>
                    <TableCell className="font-medium text-ink">{node.id}</TableCell>
                    <TableCell>
                      <Mono>{node.address}</Mono>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 capitalize">
                        <Dot
                          tone={
                            node.status === 'healthy'
                              ? 'brand'
                              : node.status === 'draining'
                                ? 'warn'
                                : 'danger'
                          }
                        />
                        {node.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Meter value={nodeCpuPct} label={`${node.id} CPU`} />
                    </TableCell>
                    <TableCell>
                      <Meter value={nodeMemPct} label={`${node.id} memory`} />
                    </TableCell>
                    <TableCell>
                      <Chip tone="neutral">{node.arch}</Chip>
                    </TableCell>
                    <TableCell>
                      <Mono>{node.version}</Mono>
                    </TableCell>
                    <TableCell className="text-right">
                      <DrainToggle
                        nodeId={node.id}
                        drain={node.status === 'draining'}
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Panel>

      {proxies.length > 0 && (
        <Panel>
          <PanelHeader
            title="Managed ingress"
            hint="One proxy job per environment — Bower-managed infrastructure"
          />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Routes</TableHead>
                <TableHead>Port</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proxies.map((row) => (
                <TableRow key={row.proxy.id}>
                  <TableCell>
                    <Mono className="text-ink">{row.proxy.trellisJobName}</Mono>
                  </TableCell>
                  <TableCell>{row.environmentName}</TableCell>
                  <TableCell className="text-ink-muted">{row.projectName}</TableCell>
                  <TableCell className="nums">
                    {routeCountMap.get(row.proxy.environmentId) ?? 0}
                  </TableCell>
                  <TableCell>
                    <Mono>{row.proxy.port}</Mono>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5 capitalize">
                      <Dot
                        tone={
                          row.proxy.status === 'running'
                            ? 'brand'
                            : row.proxy.status === 'pending'
                              ? 'warn'
                              : 'danger'
                        }
                        pulse={row.proxy.status === 'pending'}
                      />
                      {row.proxy.status}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right text-ink-muted">
                    {relTime(row.proxy.updatedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
      )}
    </div>
  )
}
