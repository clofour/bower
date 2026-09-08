import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ExecConsole } from '@/components/exec-console'
import { KeyValue, PageHeader, Panel, StatusPill, formatBytes, formatDate } from '@/components/primitives'
import { getCurrentUser } from '@/lib/auth'
import { stopAllocationAction } from '@/lib/actions/services'
import { requireService } from '@/lib/actions/shared'
import { getProjectBySlug, getServiceBySlug, getUserOrganization } from '@/lib/queries'
import { getTrellisClient } from '@/lib/trellis-instance'

export default async function AllocationPage({ params }: { params: Promise<{ slug: string; serviceSlug: string; allocationId: string }> }) {
  const { slug, serviceSlug, allocationId } = await params
  const user = await getCurrentUser()
  if (!user) notFound()
  const context = await getUserOrganization(user.id)
  if (!context) notFound()
  const project = await getProjectBySlug(context.org.id, slug)
  if (!project) notFound()
  const service = await getServiceBySlug(project.id, serviceSlug)
  if (!service) notFound()
  const access = await requireService(service.id)
  const client = await getTrellisClient(context.org.id).catch(() => null)
  if (!client) notFound()
  const inventory = await client.listAllocations().catch(() => [])
  const allocation = inventory.find((item) => item.id === allocationId)
  if (!allocation) notFound()
  const [events, metrics, job] = await Promise.all([
    client.getAllocationEvents(allocation.id).catch(() => allocation.events || []),
    client.getAllocationMetrics(allocation.id).catch(() => []),
    client.getJob(allocation.job, allocation.namespace).catch(() => null),
  ])
  const group = job?.spec.task_groups.find((item) => item.name === allocation.group)
  const tasks = group?.tasks.map((task) => task.name) || []
  const logs = await Promise.all(tasks.map(async (task) => ({ task, text: await client.getAllocationLogs(allocation.id, task, 400).catch(() => 'Logs unavailable.') })))
  const canOperate = access.projectRole !== 'viewer'
  return <>
    <PageHeader eyebrow="Allocation" title={<span className="mono">{allocation.id.slice(0, 18)}</span>} description={allocation.job + ' · ' + allocation.group + ' · ' + allocation.namespace} actions={<div className="row"><Link className="button button-secondary" href={'/projects/' + slug + '/services/' + service.slug}>Back to service</Link>{canOperate ? <form action={stopAllocationAction.bind(null, service.id, allocation.id)}><button className="button button-danger" type="submit">Stop allocation</button></form> : null}</div>} />
    <div className="grid grid-3" style={{ marginBottom: 16 }}>
      <div className="panel metric"><div className="metric-label">Lifecycle</div><div style={{ marginTop: 11 }}><StatusPill status={allocation.phase} /></div><div className="metric-detail">Transitioned {formatDate(allocation.last_transition_at)}</div></div>
      <div className="panel metric"><div className="metric-label">Health</div><div style={{ marginTop: 11 }}><StatusPill status={allocation.health} /></div><div className="metric-detail">Tracked independently from lifecycle</div></div>
      <div className="panel metric"><div className="metric-label">Attempt</div><div className="metric-value">{allocation.attempt}</div><div className="metric-detail">Generation {allocation.generation} · revision {allocation.job_revision}</div></div>
    </div>
    {allocation.reason || allocation.message ? <div className={'callout ' + (allocation.phase === 'failed' || allocation.health === 'unhealthy' ? 'danger' : 'warning')} style={{ marginBottom: 16 }}><strong>{allocation.reason || 'Diagnostic'}</strong>{allocation.message ? ' · ' + allocation.message : ''}{allocation.next_retry_at ? ' · retry ' + formatDate(allocation.next_retry_at) : ''}</div> : null}
    <div className="grid grid-2">
      <Panel title="Runtime identity" subtitle="Durable state reported by Trellis.">
        <KeyValue label="Allocation ID"><span className="mono small">{allocation.id}</span></KeyValue>
        <KeyValue label="Node"><span className="mono small">{allocation.node_id}</span></KeyValue>
        <KeyValue label="Address">{allocation.address || '—'}</KeyValue>
        <KeyValue label="Created">{formatDate(allocation.created_at)}</KeyValue>
        <KeyValue label="Draining">{allocation.draining ? 'yes' : 'no'}</KeyValue>
        <KeyValue label="Ports">{allocation.ports?.length ? <div className="row">{allocation.ports.map((port, index) => <span className="pill" key={port.label + index}>{port.label || 'port'} · {port.port} → {port.host_port}</span>)}</div> : '—'}</KeyValue>
        <KeyValue label="Labels">{Object.keys(allocation.labels || {}).length ? <pre className="code-panel">{JSON.stringify(allocation.labels, null, 2)}</pre> : '—'}</KeyValue>
      </Panel>
      <Panel title="Resource samples" subtitle="Per-task values from Trellis.">
        {metrics.length ? <div className="table-wrap"><table className="table"><thead><tr><th>Task</th><th>Memory</th><th>CPU time</th><th>Collected</th></tr></thead><tbody>{metrics.map((metric, index) => <tr key={metric.task + index}><td className="table-primary">{metric.task}</td><td>{formatBytes(metric.memory_usage_bytes)}</td><td>{(metric.cpu_usage_nanoseconds / 1000000000).toFixed(2)}s</td><td>{formatDate(metric.collected_at)}</td></tr>)}</tbody></table></div> : <div className="empty"><div className="empty-title">No metrics sample</div><div>The connected cluster did not return allocation metrics.</div></div>}
      </Panel>
    </div>
    <div style={{ height: 16 }} />
    <div className="grid grid-2">
      <Panel title="Lifecycle events" subtitle="Why this allocation moved between phases.">{events.length ? <div className="timeline">{events.map((event, index) => <div className="timeline-item" key={event.at + index}><div className="timeline-title">{event.phase}{event.reason ? ' · ' + event.reason : ''}</div><div className="timeline-meta">{event.message || 'No message'} · {formatDate(event.at)}</div></div>)}</div> : <div className="muted small">No lifecycle events returned.</div>}</Panel>
      <Panel title="Container command" subtitle={canOperate ? 'Run a command in a task and inspect its output.' : 'Viewer access is read-only.'}>{canOperate ? <ExecConsole serviceId={service.id} allocationId={allocation.id} tasks={tasks} /> : <div className="muted small">Your project role does not permit container commands.</div>}</Panel>
    </div>
    <div style={{ height: 16 }} />
    <Panel title="Logs" subtitle="Last 400 lines per task.">{logs.length ? logs.map(({ task, text }) => <details className="disclosure" key={task} open={logs.length === 1}><summary>{task}</summary><div className="disclosure-body"><pre className="code-panel">{text || 'No log output.'}</pre></div></details>) : <div className="empty"><div className="empty-title">No tasks found</div><div>The allocation could not be matched to a task group.</div></div>}</Panel>
  </>
}
