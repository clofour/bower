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
        title="Cluster"
        description="Trellis cluster node overview"
      />

      {error ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Server className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mb-1 text-sm font-medium">Unable to reach cluster</h3>
          <p className="max-w-md text-center text-sm text-muted-foreground">{error}</p>
        </Card>
      ) : nodes.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Server className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mb-1 text-sm font-medium">No nodes</h3>
          <p className="text-sm text-muted-foreground">
            No nodes are registered with the Trellis cluster.
          </p>
        </Card>
      ) : (
        <Card>
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
