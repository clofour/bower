import { notFound, redirect } from 'next/navigation'
import { Activity, Box, Code2, ExternalLink, Play, RotateCcw, Scale } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { getDeploymentsByService, getEnvironmentsByProject, getProjectBySlug, getSecretsByProject, getServiceBySlug, getServiceConfigsWithEnvironments, getSidecars } from '@/lib/queries'
import { getUserOrganization } from '@/lib/queries'
import { getTrellisClient } from '@/lib/trellis-instance'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Status } from '@/components/status'
import { ExecDialog } from '@/components/exec-dialog'
import { NoopButton } from '@/components/noop-button'
import { deleteSidecarAction, deployServiceAction, promoteServiceAction, restartServiceAction, resumeServiceAction, rollbackServiceAction, scaleServiceAction, stopAllocationAction, updateServiceConfigAction, upsertSidecarAction } from '@/lib/actions/services'
import type { TrellisAllocation, TrellisAllocationMetrics } from '@/types/trellis'

export default async function ServicePage({ params, searchParams }: {
  params: Promise<{ slug: string; serviceSlug: string }>
  searchParams: Promise<{ environment?: string }>
}) {
  const user = await getCurrentUser(); if (!user) redirect('/login')
  const ctx = await getUserOrganization(user.id); if (!ctx) redirect('/login')
  const { slug, serviceSlug } = await params
  const project = await getProjectBySlug(ctx.org.id, slug); if (!project) notFound()
  const service = await getServiceBySlug(project.id, serviceSlug); if (!service) notFound()
  const [configs, envs] = await Promise.all([getServiceConfigsWithEnvironments(service.id), getEnvironmentsByProject(project.id)])
  const selectedSlug = (await searchParams).environment ?? envs[0]?.slug
  const current = configs.find((item) => item.environment.slug === selectedSlug) ?? configs[0]
  const currentIndex = configs.findIndex((item) => item.environment.id === current?.environment.id)
  const nextEnvironment = currentIndex >= 0 ? configs[currentIndex + 1]?.environment : undefined
  let allocations: TrellisAllocation[] = []; let connectionError = ''
  const metricsMap: Record<string, TrellisAllocationMetrics[]> = {}
  if (current && ctx.org.trellisApiUrl && ctx.org.trellisApiToken) {
    try {
      const client = await getTrellisClient(ctx.org.id)
      allocations = await client.listAllocations({ namespace: current.environment.trellisNamespace, job: current.config.activeJobName || service.slug })
      const metricsResults = await Promise.allSettled(allocations.map((a) => client.getAllocationMetrics(a.id)))
      for (let i = 0; i < allocations.length; i++) {
        const result = metricsResults[i]
        if (result?.status === 'fulfilled') metricsMap[allocations[i]!.id] = result.value
      }
    }
    catch (error) { connectionError = error instanceof Error ? error.message : 'Unable to reach Trellis.' }
  }
  if (!current) return <Card className="p-8">Create an environment before configuring this service.</Card>
  const [attachedSidecars, recentDeployments, projectSecrets] = await Promise.all([getSidecars(current.config.id), getDeploymentsByService(service.id, 5), getSecretsByProject(project.id)])
  const availableSecrets = projectSecrets.filter(({ secret }) => secret.environmentId === current.environment.id)
  const envText = Object.entries(current.config.envVars as Record<string, string>).map(([key, value]) => `${key}=${value}`).join('\n')
  const labelsText = Object.entries(current.config.labels as Record<string, string>).map(([key, value]) => `${key}=${value}`).join('\n')
  const diagnostics = allocations.filter((allocation) => allocation.phase === 'failed' || allocation.phase === 'lost' || allocation.health === 'unhealthy' || allocation.reason)

  return <div className="space-y-8">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div><p className="text-xs font-medium uppercase tracking-widest text-primary">{service.type} service</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">{service.name}</h2>
        <p className="mt-1 font-mono text-xs text-muted-foreground">{current.environment.trellisNamespace} / {service.slug}</p></div>
      <div className="flex flex-wrap gap-2">
        {service.type === 'cron' ? <NoopButton feature="Cron and periodic jobs"><Play className="mr-2 h-4 w-4" />Deploy</NoopButton> : <form action={deployServiceAction.bind(null, service.id, current.environment.id)}><Button><Play className="mr-2 h-4 w-4" />Deploy</Button></form>}
        {nextEnvironment && <form action={promoteServiceAction.bind(null, service.id, current.environment.id, nextEnvironment.id)}><Button variant="secondary">Promote to {nextEnvironment.name}</Button></form>}
        <form action={rollbackServiceAction.bind(null, service.id, current.environment.id)}><Button variant="outline"><RotateCcw className="mr-2 h-4 w-4" />Rollback</Button></form>
        <form action={restartServiceAction.bind(null, service.id, current.environment.id)}><Button variant="outline">Restart</Button></form>
        <ExecDialog serviceId={service.id} allocations={allocations} />
        <a href={`/projects/${slug}/services/${serviceSlug}/revisions${current.environment.slug ? `?environment=${current.environment.slug}` : ''}`}><Button variant="outline">Revisions</Button></a>
      </div>
    </div>

    <div className="flex gap-2 overflow-x-auto rounded-xl border bg-muted/40 p-1.5">
      {configs.map(({ environment }) => <a key={environment.id} href={`?environment=${environment.slug}`}
        className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${environment.slug === current.environment.slug ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
        {environment.name}{environment.isLocked ? ' · locked' : ''}</a>)}
    </div>

    <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
      <Card className="p-6">
        <div className="mb-6 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10"><Code2 className="h-4 w-4 text-primary" /></span><div><h3 className="font-bold">Runtime configuration</h3><p className="text-xs text-muted-foreground">Changes are staged until the next deployment.</p></div></div>
        <form action={updateServiceConfigAction.bind(null, service.id, current.environment.id)} className="space-y-5">
          <div><Label htmlFor="image">Container image</Label><Input id="image" name="image" defaultValue={current.config.image} className="mt-2 font-mono" /></div>
          <div className="grid gap-4 sm:grid-cols-3"><div><Label htmlFor="replicas">Replicas</Label><Input id="replicas" name="replicas" type="number" min="0" defaultValue={current.config.replicas} className="mt-2" /></div><div><Label htmlFor="port">Port</Label><Input id="port" name="port" type="number" defaultValue={current.config.port ?? ''} className="mt-2" /></div><div><Label htmlFor="strategy">Strategy</Label><select id="strategy" name="strategy" defaultValue={current.config.deploymentStrategy} className="mt-2 h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="rolling">Rolling</option><option value="recreate">Recreate</option><option value="blue_green">Blue-green</option><option value="canary">Canary</option></select></div></div>
          <div className="grid gap-4 sm:grid-cols-3"><div><Label>Resource tier</Label><select name="resourceTier" defaultValue={current.config.resourceTier} className="mt-2 h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option><option value="xl">XL</option><option value="custom">Custom</option></select></div><div><Label>Custom CPU (m)</Label><Input name="cpu" type="number" min="1" defaultValue={current.config.cpu} className="mt-2" /></div><div><Label>Custom memory (MiB)</Label><Input name="memory" type="number" min="1" defaultValue={Math.round(current.config.memory / 1048576)} className="mt-2" /></div></div>
          <div className="grid gap-4 sm:grid-cols-3"><div><Label>Health check</Label><select name="healthType" defaultValue={current.config.healthCheckType ?? ''} className="mt-2 h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Disabled</option><option value="http">HTTP</option><option value="tcp">TCP</option><option value="script">Script</option></select></div><div><Label>Health path</Label><Input name="healthPath" defaultValue={current.config.healthCheckPath ?? ''} className="mt-2 font-mono" /></div><div><Label>Script command</Label><Input name="healthCommand" defaultValue={(current.config.healthCheckCommand as string[]).join(' ')} className="mt-2 font-mono" /></div></div>
          <div className="grid gap-4 sm:grid-cols-4"><div><Label>Interval (s)</Label><Input name="healthInterval" type="number" min="1" defaultValue={current.config.healthCheckInterval} className="mt-2" /></div><div><Label>Timeout (s)</Label><Input name="healthTimeout" type="number" min="1" defaultValue={current.config.healthCheckTimeout} className="mt-2" /></div><div><Label>Threshold</Label><Input name="healthThreshold" type="number" min="1" defaultValue={current.config.healthCheckThreshold} className="mt-2" /></div><div><Label>Auto rollback (s)</Label><Input name="autoRollbackSeconds" type="number" min="30" defaultValue={current.config.autoRollbackSeconds} className="mt-2" /></div></div>
          <div><Label>Command override</Label><Input name="command" defaultValue={current.config.command ?? ''} className="mt-2 font-mono" /></div>
          <div><Label htmlFor="envVars">Environment variables</Label><Textarea id="envVars" name="envVars" defaultValue={envText} className="mt-2 min-h-28 font-mono text-xs" placeholder={'KEY=value\nOTHER=value'} /></div>
          <div><Label>Labels</Label><Textarea name="labels" defaultValue={labelsText} className="mt-2 min-h-20 font-mono text-xs" placeholder={'team=platform\ntier=backend'} /></div>
          <div><Label>Secret bindings (JSON)</Label><Textarea name="secretBindings" defaultValue={JSON.stringify(current.config.secretBindings, null, 2)} className="mt-2 min-h-24 font-mono text-xs" placeholder={'[{"name":"DATABASE_URL","target":"env","env":"DATABASE_URL"}]'} /><p className="mt-2 text-xs text-muted-foreground">Available: {availableSecrets.map(({ secret }) => secret.name).join(', ') || 'add an environment secret first'}</p></div>
          <div><Label>Volumes (JSON)</Label><Textarea name="volumes" defaultValue={JSON.stringify(current.config.volumes, null, 2)} className="mt-2 min-h-24 font-mono text-xs" placeholder={'[{"name":"data","path":"/data","host_volume":"database"}]'} /></div>
          {service.type === 'cron' && <div><Label>Schedule</Label><Input name="cronSchedule" defaultValue={current.config.cronSchedule ?? ''} placeholder="0 * * * *" className="mt-2 font-mono" /></div>}
          {current.config.deploymentStrategy === 'canary' && <div><Label>Canary steps (JSON)</Label><Input name="canarySteps" defaultValue={JSON.stringify(current.config.canarySteps)} className="mt-2 font-mono" /></div>}
          {service.type === 'custom' && <div><Label>Raw Trellis JobSpec (JSON)</Label><Textarea name="rawConfig" defaultValue={current.config.rawConfig ? JSON.stringify(current.config.rawConfig, null, 2) : ''} className="mt-2 min-h-56 font-mono text-xs" /></div>}
          <Button type="submit" variant="secondary">Save configuration</Button>
        </form>
      </Card>
      <div className="space-y-5">
        <Card className="p-5"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Scale</p><p className="mt-1 text-3xl font-bold">{current.config.replicas}</p></div><Scale className="h-5 w-5 text-primary" /></div><div className="mt-4 flex flex-wrap gap-2">
          <form action={scaleServiceAction.bind(null, service.id, current.environment.id, current.config.replicas + 1)}><Button size="sm" variant="outline">+ 1 replica</Button></form>
          {current.config.replicas === 0 && current.config.pausedReplicas ? <form action={resumeServiceAction.bind(null, service.id, current.environment.id)}><Button size="sm" variant="ghost">Resume {current.config.pausedReplicas}</Button></form> : <form action={scaleServiceAction.bind(null, service.id, current.environment.id, 0)}><Button size="sm" variant="ghost">Pause</Button></form>}
        </div></Card>
        <Card className="p-5"><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current artifact</p><p className="mt-3 break-all font-mono text-sm">{current.config.image}</p><div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><Box className="h-3.5 w-3.5" />{current.config.cpu}m · {Math.round(current.config.memory / 1048576)} MiB</div></Card>
      </div>
    </div>

    <div className="grid gap-5 xl:grid-cols-2"><Card className="p-6"><h3 className="font-bold">Sidecars</h3><p className="text-sm text-muted-foreground">Additional containers colocated with the primary task.</p><div className="mt-4 space-y-2">{attachedSidecars.map((sidecar) => <div key={sidecar.id} className="flex items-center justify-between rounded-xl border p-3"><div><b className="text-sm">{sidecar.name}</b><p className="font-mono text-xs text-muted-foreground">{sidecar.image}</p></div><form action={deleteSidecarAction.bind(null, service.id, sidecar.id)}><Button size="sm" variant="ghost">Remove</Button></form></div>)}</div><form action={upsertSidecarAction.bind(null, service.id, current.environment.id)} className="mt-4 grid gap-2 sm:grid-cols-2"><Input name="name" placeholder="Sidecar name" required /><Input name="image" placeholder="Image" required /><Input name="cpu" type="number" defaultValue="100" placeholder="CPU (m)" /><Input name="memory" type="number" defaultValue="128" placeholder="Memory (MiB)" /><Input name="port" type="number" placeholder="Optional port" /><Input name="command" placeholder="Optional command" /><Textarea name="envVars" placeholder="KEY=value" className="sm:col-span-2" /><Button className="sm:col-span-2" variant="secondary">Add sidecar</Button></form></Card>
      <Card className="p-6"><div className="flex items-center justify-between"><div><h3 className="font-bold">Diagnose</h3><p className="text-sm text-muted-foreground">Failure and pending reasons reported by Trellis.</p></div></div><div className="mt-4 space-y-2">{diagnostics.length ? diagnostics.map((allocation) => <div key={allocation.id} className="rounded-xl border p-3 text-sm"><div className="flex justify-between"><b className="font-mono">{allocation.id.slice(0, 12)}</b><Status value={allocation.health} /></div><p className="mt-2 text-muted-foreground">{allocation.reason || allocation.phase}: {allocation.message || 'No diagnostic message.'}</p><p className="mt-1 text-xs text-muted-foreground">Attempt {allocation.attempt}{allocation.next_retry_at ? ` · retries ${new Date(allocation.next_retry_at).toLocaleString()}` : ''}</p></div>) : <p className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">No unhealthy, failed, lost, or pending-reason allocations.</p>}</div><div className="mt-6"><h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recent deployments</h4>{recentDeployments.map((deployment) => <div key={deployment.id} className="mt-2 flex justify-between text-sm"><span className="truncate font-mono">{deployment.imageAfter}</span><Status value={deployment.status} /></div>)}</div></Card></div>

    <section><div className="mb-4 flex items-center justify-between"><div><h3 className="font-bold">Allocations</h3><p className="text-sm text-muted-foreground">Lifecycle and health are reported independently by Trellis.</p></div><Activity className="h-5 w-5 text-muted-foreground" /></div>
      {connectionError ? <Card className="border-amber-500/20 bg-amber-500/5 p-5 text-sm text-amber-700 dark:text-amber-300">{connectionError}</Card> : allocations.length === 0 ? <Card className="p-8 text-center text-sm text-muted-foreground">No allocations are currently reported for this environment.</Card> : <div className="grid gap-3">{allocations.map((allocation) => { const metrics = metricsMap[allocation.id]; return <Card key={allocation.id} className="p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-mono text-sm font-semibold">{allocation.id.slice(0, 12)}</p><p className="mt-1 text-xs text-muted-foreground">{allocation.address ?? 'Awaiting node'} · generation {allocation.generation}</p></div><div className="flex gap-2"><Status value={allocation.phase} /><Status value={allocation.health} /></div></div>{allocation.message && <p className="mt-3 text-sm text-muted-foreground">{allocation.message}</p>}{metrics && metrics.length > 0 && <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">{metrics.map((m) => <span key={m.task}><span className="font-mono font-medium">{m.task}</span> · {(m.cpu_usage_nanoseconds / 1e6).toFixed(1)} ms CPU · {Math.round(m.memory_usage_bytes / 1048576)} MiB</span>)}</div>}<div className="mt-4 flex gap-2"><a href={`/projects/${slug}/services/${service.slug}/allocations/${allocation.id}`}><Button size="sm" variant="outline">Logs & events <ExternalLink className="ml-2 h-3.5 w-3.5" /></Button></a><form action={stopAllocationAction.bind(null, service.id, allocation.id)}><Button size="sm" variant="ghost">Stop</Button></form></div></Card> })}</div>}
    </section>
  </div>
}
