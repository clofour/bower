import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getUserOrganization } from '@/lib/queries'
import { getTrellisClient } from '@/lib/trellis-instance'
import { PageHeading } from '@/components/page-heading'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusDot } from '@/components/status'
import { Badge } from '@/components/ui/badge'
import { Server } from 'lucide-react'
import { DrainToggle } from './drain-toggle'

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${Math.round(kb)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${Math.round(mb)} MB`
  const gb = mb / 1024
  return `${gb.toFixed(1)} GB`
}

function formatCpu(millicores: number) {
  if (millicores >= 1000) return `${(millicores / 1000).toFixed(1)} cores`
  return `${millicores}m`
}

export default async function ClusterPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const orgCtx = await getUserOrganization(user.id)
  if (!orgCtx) redirect('/login')

  let nodes: Awaited<ReturnType<Awaited<ReturnType<typeof getTrellisClient>>['listNodes']>> = []
  let error: string | null = null

  try {
    const client = await getTrellisClient(orgCtx.org.id)
    nodes = await client.listNodes()
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to connect to Trellis cluster.'
  }

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Trellis"
        title="Cluster nodes"
        description={nodes.length ? `${nodes.length} registered node${nodes.length === 1 ? '' : 's'}. Capacity and scheduling state update when this route refreshes.` : 'Readiness, capacity, and scheduling state for Trellis nodes.'}
      />

      {error ? (
        <div role="alert"><EmptyState icon={<Server className="h-5 w-5" />} title="Cluster connection unavailable" description={`${error} Check the Trellis API connection in organization settings, then reload this page.`} /></div>
      ) : nodes.length === 0 ? (
        <EmptyState icon={<Server className="h-5 w-5" />} title="No cluster nodes" description="Register a Trellis node before scheduling workloads. Nodes will appear here once they connect." />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>CPU</TableHead>
                <TableHead>Memory</TableHead>
                <TableHead>Arch</TableHead>
                <TableHead>Version</TableHead>
                <TableHead className="text-right">Drain</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nodes.map((node) => (
                <TableRow key={node.id}>
                  <TableCell className="font-medium">{node.id}</TableCell>
                  <TableCell>
                    <StatusDot status={node.status} />
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {node.address}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{formatCpu(node.cpu)}</span>
                      {node.cpu_used !== undefined && (
                        <span className="text-xs text-muted-foreground">
                          {formatCpu(node.cpu_used)} used
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{formatBytes(node.memory)}</span>
                      {node.memory_used !== undefined && (
                        <span className="text-xs text-muted-foreground">
                          {formatBytes(node.memory_used)} used
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{node.arch}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {node.version}
                  </TableCell>
                  <TableCell className="text-right">
                    <DrainToggle
                      nodeId={node.id}
                      drain={node.status === 'draining'}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
