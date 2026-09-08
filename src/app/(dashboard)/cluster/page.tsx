import { Server, Wind } from 'lucide-react'
import { PageHeader, Metric, Panel, Pill, StatusPill, formatBytes, formatDate, percent } from '@/components/primitives'
import { requireContext } from '@/lib/actions/shared'
import { setNodeDrainAction } from '@/lib/actions/operations'
import { getTrellisClient } from '@/lib/trellis-instance'
import type { TrellisAllocation, TrellisNode } from '@/types/trellis'

export default async function ClusterPage() {
  const context = await requireContext()
  let nodes: TrellisNode[] = []
  let allocations: TrellisAllocation[] = []
  let error = ''

  try {
    const client = await getTrellisClient(context.org.id)
    ;[nodes, allocations] = await Promise.all([
      client.listNodes(),
      client.listAllocations().catch(() => []),
    ])
  } catch (cause) {
    error = cause instanceof Error ? cause.message : 'Could not reach the Trellis cluster.'
  }

  const totalCpu = nodes.reduce((sum, node) => sum + node.cpu, 0)
  const usedCpu = nodes.reduce((sum, node) => sum + (node.cpu_used || 0), 0)
  const totalMemory = nodes.reduce((sum, node) => sum + node.memory, 0)
  const usedMemory = nodes.reduce((sum, node) => sum + (node.memory_used || 0), 0)

  return (
    <>
      <PageHeader
        eyebrow="Trellis"
        title="Cluster"
        description="Physical scheduling capacity stays a Trellis concern; Bower exposes the operational state application owners need."
      />

      {error ? <div className="callout danger" style={{ marginBottom: 16 }}>{error}</div> : null}

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <Metric label="Nodes" value={nodes.length || '—'} detail={nodes.length ? nodes.filter((node) => node.status === 'healthy').length + ' healthy' : 'Unavailable'} />
        <Metric label="Allocations" value={allocations.length || '—'} detail={allocations.length ? allocations.filter((allocation) => allocation.phase === 'running').length + ' running' : 'No live inventory'} />
        <Metric label="CPU" value={nodes.length ? percent(usedCpu, totalCpu) + '%' : '—'} detail={nodes.length ? usedCpu + 'm / ' + totalCpu + 'm' : 'No capacity data'} />
        <Metric label="Memory" value={nodes.length ? percent(usedMemory, totalMemory) + '%' : '—'} detail={nodes.length ? formatBytes(usedMemory) + ' / ' + formatBytes(totalMemory) : 'No capacity data'} />
      </div>

      <div className="grid grid-2">
        {nodes.map((node) => {
          const nodeAllocations = allocations.filter((allocation) => allocation.node_id === node.id)
          const cpuPercent = percent(node.cpu_used, node.cpu)
          const memoryPercent = percent(node.memory_used, node.memory)
          return (
            <Panel
              key={node.id}
              title={<span className="row"><Server size={15} />{node.host || node.address}<StatusPill status={node.status} /></span>}
              subtitle={node.id}
              action={context.role === 'owner' ? (
                <form action={setNodeDrainAction.bind(null, node.id, node.status !== 'draining')}>
                  <button className="button button-secondary button-sm" type="submit">
                    <Wind size={12} />{node.status === 'draining' ? 'Undrain' : 'Drain'}
                  </button>
                </form>
              ) : undefined}
            >
              <div className="grid grid-2">
                <div>
                  <div className="row-between small"><span className="muted">CPU</span><span>{node.cpu_used || 0}m / {node.cpu}m</span></div>
                  <div className="progress" style={{ marginTop: 6 }}><span style={{ width: cpuPercent + '%' }} /></div>
                </div>
                <div>
                  <div className="row-between small"><span className="muted">Memory</span><span>{formatBytes(node.memory_used || 0)} / {formatBytes(node.memory)}</span></div>
                  <div className="progress" style={{ marginTop: 6 }}><span style={{ width: memoryPercent + '%' }} /></div>
                </div>
              </div>
              <div className="separator" />
              <div className="grid grid-2">
                <div className="key-value"><div className="key-label">Runtime</div><div>{node.os}/{node.arch}</div></div>
                <div className="key-value"><div className="key-label">Version</div><div className="mono small">{node.version}</div></div>
                <div className="key-value"><div className="key-label">Allocations</div><div>{nodeAllocations.length}</div></div>
                <div className="key-value"><div className="key-label">Heartbeat</div><div>{formatDate(node.last_heartbeat)}</div></div>
              </div>
              {Object.keys(node.labels || {}).length ? (
                <div className="row" style={{ marginTop: 13 }}>
                  {Object.entries(node.labels).map(([key, value]) => <Pill key={key}>{key}={value}</Pill>)}
                </div>
              ) : null}
              {(node.host_volumes || node.volumes || []).length ? (
                <div className="small muted" style={{ marginTop: 13 }}>Host volumes: {(node.host_volumes || node.volumes || []).join(', ')}</div>
              ) : null}
            </Panel>
          )
        })}
      </div>

      {!error && nodes.length === 0 ? (
        <Panel><div className="empty"><div className="empty-title">No nodes reported</div><div>Check the organization Trellis connection and cluster registration.</div></div></Panel>
      ) : null}
    </>
  )
}
