import { notFound, redirect } from 'next/navigation'
import { Activity, Box, Code2, ExternalLink, Play, RotateCcw, Scale, TerminalSquare } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { getEnvironmentsByProject, getProjectBySlug, getServiceBySlug, getServiceConfigsWithEnvironments } from '@/lib/queries'
import { getUserOrganization } from '@/lib/queries'
import { getTrellisClient } from '@/lib/trellis-instance'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Status } from '@/components/status'
import { NoopButton } from '@/components/noop-button'
import { deployServiceAction, promoteServiceAction, rollbackServiceAction, scaleServiceAction, updateServiceConfigAction } from '@/lib/actions/services'
import type { TrellisAllocation } from '@/types/trellis'

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
  if (current && ctx.org.trellisApiUrl && ctx.org.trellisApiToken) {
    try { allocations = await (await getTrellisClient(ctx.org.id)).listAllocations({ namespace: current.environment.trellisNamespace, job: service.slug }) }
    catch (error) { connectionError = error instanceof Error ? error.message : 'Unable to reach Trellis.' }
  }
  if (!current) return <Card className="p-8">Create an environment before configuring this service.</Card>
  const envText = Object.entries(current.config.envVars as Record<string, string>).map(([key, value]) => `${key}=${value}`).join('\n')

  return <div className="space-y-8">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div><p className="text-[11px] font-bold uppercase tracking-[.2em] text-primary">{service.type} service</p>
        <h2 className="mt-2 text-3xl font-black tracking-[-.04em]">{service.name}</h2>
        <p className="mt-1 font-mono text-xs text-muted-foreground">{current.environment.trellisNamespace} / {service.slug}</p></div>
      <div className="flex flex-wrap gap-2">
        <form action={deployServiceAction.bind(null, service.id, current.environment.id)}><Button><Play className="mr-2 h-4 w-4" />Deploy</Button></form>
        {nextEnvironment && <form action={promoteServiceAction.bind(null, service.id, current.environment.id, nextEnvironment.id)}><Button variant="secondary">Promote to {nextEnvironment.name}</Button></form>}
        <form action={rollbackServiceAction.bind(null, service.id, current.environment.id)}><Button variant="outline"><RotateCcw className="mr-2 h-4 w-4" />Rollback</Button></form>
        <NoopButton feature="Restart">Restart</NoopButton>
        <NoopButton feature="Exec"><TerminalSquare className="mr-2 h-4 w-4" />Exec</NoopButton>
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
          {service.type === 'web' && <div><Label htmlFor="healthPath">Health path</Label><Input id="healthPath" name="healthPath" defaultValue={current.config.healthCheckPath ?? '/health'} className="mt-2 font-mono" /></div>}
          <div><Label htmlFor="envVars">Environment variables</Label><Textarea id="envVars" name="envVars" defaultValue={envText} className="mt-2 min-h-28 font-mono text-xs" placeholder={'KEY=value\nOTHER=value'} /></div>
          <Button type="submit" variant="secondary">Save configuration</Button>
        </form>
      </Card>
      <div className="space-y-5">
        <Card className="p-5"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Scale</p><p className="mt-1 text-3xl font-black">{current.config.replicas}</p></div><Scale className="h-5 w-5 text-primary" /></div><div className="mt-4 flex flex-wrap gap-2">
          <form action={scaleServiceAction.bind(null, service.id, current.environment.id, current.config.replicas + 1)}><Button size="sm" variant="outline">+ 1 replica</Button></form>
          <form action={scaleServiceAction.bind(null, service.id, current.environment.id, 0)}><Button size="sm" variant="ghost">Pause</Button></form>
        </div></Card>
        <Card className="p-5"><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current artifact</p><p className="mt-3 break-all font-mono text-sm">{current.config.image}</p><div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><Box className="h-3.5 w-3.5" />{current.config.cpu}m · {Math.round(current.config.memory / 1048576)} MiB</div></Card>
      </div>
    </div>

    <section><div className="mb-4 flex items-center justify-between"><div><h3 className="font-bold">Allocations</h3><p className="text-sm text-muted-foreground">Lifecycle and health are reported independently by Trellis.</p></div><Activity className="h-5 w-5 text-muted-foreground" /></div>
      {connectionError ? <Card className="border-amber-500/20 bg-amber-500/5 p-5 text-sm text-amber-700 dark:text-amber-300">{connectionError}</Card> : allocations.length === 0 ? <Card className="p-8 text-center text-sm text-muted-foreground">No allocations are currently reported for this environment.</Card> : <div className="grid gap-3">{allocations.map((allocation) => <Card key={allocation.id} className="p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-mono text-sm font-semibold">{allocation.id.slice(0, 12)}</p><p className="mt-1 text-xs text-muted-foreground">{allocation.address ?? 'Awaiting node'} · generation {allocation.generation}</p></div><div className="flex gap-2"><Status value={allocation.phase} /><Status value={allocation.health} /></div></div>{allocation.message && <p className="mt-3 text-sm text-muted-foreground">{allocation.message}</p>}<div className="mt-4 flex gap-2"><a href={`/projects/${slug}/services/${service.slug}/allocations/${allocation.id}`}><Button size="sm" variant="outline">Logs & events <ExternalLink className="ml-2 h-3.5 w-3.5" /></Button></a><NoopButton feature="Stop allocation" variant="ghost">Stop</NoopButton></div></Card>)}</div>}
    </section>
  </div>
}
