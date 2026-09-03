import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, Clock3, Terminal } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { getProjectBySlug, getServiceBySlug, getUserOrganization } from '@/lib/queries'
import { getTrellisClient } from '@/lib/trellis-instance'
import { Card } from '@/components/ui/card'
import { Status } from '@/components/status'

export default async function AllocationPage({ params, searchParams }: {
  params: Promise<{ slug: string; serviceSlug: string; allocationId: string }>
  searchParams: Promise<{ namespace?: string; task?: string }>
}) {
  const user = await getCurrentUser(); if (!user) redirect('/login')
  const ctx = await getUserOrganization(user.id); if (!ctx) redirect('/login')
  const { slug, serviceSlug, allocationId } = await params
  const project = await getProjectBySlug(ctx.org.id, slug); if (!project) notFound()
  const service = await getServiceBySlug(project.id, serviceSlug); if (!service) notFound()
  const query = await searchParams
  const client = await getTrellisClient(ctx.org.id)
  const all = await client.listAllocations({ namespace: query.namespace, job: service.slug })
  const allocation = all.find((item) => item.id === allocationId); if (!allocation) notFound()
  let events = allocation.events ?? []; let logs = ''; let error = ''
  const job = await client.getJob(service.slug, allocation.namespace)
  const group = job.spec.task_groups.find((item) => item.name === allocation.group)
  const tasks = group?.tasks.map((task) => task.name) ?? [service.slug]
  const selectedTask = query.task && tasks.includes(query.task) ? query.task : tasks[0]
  try { events = await client.getAllocationEvents(allocation.id); logs = await client.getAllocationLogs(allocation.id, selectedTask, 300) }
  catch (reason) { error = reason instanceof Error ? reason.message : 'Could not retrieve allocation details.' }

  return <div className="space-y-6">
    <a href={`/projects/${slug}/services/${serviceSlug}?environment=${allocation.namespace.replace(`${slug}-`, '')}`} className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to {service.name}</a>
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-[.2em] text-primary">Allocation</p><h2 className="mt-2 font-mono text-2xl font-black">{allocation.id}</h2><p className="mt-1 text-sm text-muted-foreground">{allocation.address ?? 'No node assigned'} · revision {allocation.job_revision}</p></div><div className="flex gap-2"><Status value={allocation.phase} /><Status value={allocation.health} /></div></div>
    {error && <Card className="border-amber-500/20 bg-amber-500/5 p-4 text-sm">{error}</Card>}
    <div className="grid gap-5 xl:grid-cols-[1.4fr_.6fr]">
      <Card className="overflow-hidden"><div className="flex items-center justify-between border-b bg-[hsl(224,35%,11%)] px-5 py-3 text-white"><div className="flex items-center gap-2 text-sm font-bold"><Terminal className="h-4 w-4 text-cyan-300" />Live logs</div><div className="flex gap-1">{tasks.map((task) => <a key={task} href={`?namespace=${allocation.namespace}&task=${task}`} className={`rounded-md px-2.5 py-1 text-xs ${task === selectedTask ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white'}`}>{task}</a>)}</div></div><pre className="min-h-[460px] overflow-auto bg-[hsl(224,35%,8%)] p-5 font-mono text-xs leading-6 text-slate-300">{logs || 'No log output.'}</pre></Card>
      <Card className="p-5"><div className="mb-5 flex items-center gap-2"><Clock3 className="h-4 w-4 text-primary" /><h3 className="font-bold">Lifecycle</h3></div><ol className="relative space-y-5 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-border">{events.map((event, index) => <li key={`${event.at}-${index}`} className="relative pl-7"><span className="absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border-4 border-background bg-primary" /><div className="flex items-center justify-between gap-2"><p className="text-sm font-bold capitalize">{event.phase}</p><time className="text-[10px] text-muted-foreground">{new Date(event.at).toLocaleTimeString()}</time></div>{event.reason && <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-primary">{event.reason}</p>}<p className="mt-1 text-xs leading-5 text-muted-foreground">{event.message || 'State transitioned.'}</p></li>)}</ol></Card>
    </div>
  </div>
}
