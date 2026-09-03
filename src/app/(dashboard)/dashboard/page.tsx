import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Activity, ArrowUpRight, FolderKanban, Gauge, Rocket, Server } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { getDeploymentsByProject, getProjectsForUser, getServicesByProject, getUserOrganization } from '@/lib/queries'
import { getTrellisClient } from '@/lib/trellis-instance'
import { Card } from '@/components/ui/card'
import { PageHeading } from '@/components/page-heading'
import { Status } from '@/components/status'

export default async function OverviewPage() {
  const user = await getCurrentUser(); if (!user) redirect('/login')
  const ctx = await getUserOrganization(user.id); if (!ctx) redirect('/login')
  const projects = await getProjectsForUser(ctx.org.id, user.id, ctx.role)
  const details = await Promise.all(projects.map(async (project) => ({ project, services: await getServicesByProject(project.id), deployments: await getDeploymentsByProject(project.id, 6) })))
  const allDeployments = details.flatMap((item) => item.deployments).sort((a, b) => +new Date(b.deployment.createdAt) - +new Date(a.deployment.createdAt)).slice(0, 8)
  let nodes = 0; let clusterState = 'Not connected'
  if (ctx.org.trellisApiUrl && ctx.org.trellisApiToken) try { const list = await (await getTrellisClient(ctx.org.id)).listNodes(); nodes = list.length; clusterState = list.some((node) => node.status === 'unhealthy') ? 'Needs attention' : 'Healthy' } catch { clusterState = 'Unavailable' }
  const serviceCount = details.reduce((sum, item) => sum + item.services.length, 0)
  const healthyDeployments = allDeployments.filter((item) => item.deployment.status === 'healthy').length

  return <div className="mx-auto max-w-7xl"><PageHeading eyebrow="Control plane" title={`Good ${new Date().getHours() < 12 ? 'morning' : 'afternoon'}, ${user.name.split(' ')[0]}.`} description="A focused view of what is shipping, what is healthy, and what needs your attention." />
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{[
      [FolderKanban, 'Projects', projects.length, 'Organized workloads'], [Activity, 'Services', serviceCount, 'Across all environments'], [Server, 'Cluster nodes', nodes, clusterState], [Gauge, 'Recent healthy', healthyDeployments, `of ${allDeployments.length} deployments`],
    ].map(([Icon, label, value, detail]) => { const C = Icon as typeof FolderKanban; return <Card key={String(label)} className="relative overflow-hidden p-5"><div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5" /><C className="h-4 w-4 text-primary" /><p className="mt-6 text-3xl font-black tracking-tight">{String(value)}</p><p className="mt-1 text-sm font-bold">{String(label)}</p><p className="mt-1 text-xs text-muted-foreground">{String(detail)}</p></Card> })}</div>
    <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_.85fr]"><section><div className="mb-4 flex items-center justify-between"><h2 className="font-bold">Projects</h2><Link href="/projects" className="text-xs font-bold text-primary">View all</Link></div><div className="grid gap-3">{details.slice(0, 4).map(({ project, services }) => <Link key={project.id} href={`/projects/${project.slug}`}><Card className="group flex items-center justify-between p-5 transition hover:border-primary/30"><div><p className="font-bold">{project.name}</p><p className="mt-1 text-xs text-muted-foreground">{services.length} service{services.length === 1 ? '' : 's'} · {project.description || 'No description'}</p></div><ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" /></Card></Link>)}</div></section>
      <section><div className="mb-4 flex items-center justify-between"><h2 className="font-bold">Deployment feed</h2><Rocket className="h-4 w-4 text-muted-foreground" /></div><Card className="divide-y overflow-hidden">{allDeployments.length === 0 ? <div className="p-10 text-center text-sm text-muted-foreground">Your deployment activity will appear here.</div> : allDeployments.map((row) => <div key={row.deployment.id} className="flex items-center justify-between gap-3 p-4"><div className="min-w-0"><p className="truncate text-sm font-bold">{row.serviceName}</p><p className="truncate font-mono text-[11px] text-muted-foreground">{row.deployment.imageAfter}</p></div><Status value={row.deployment.status} /></div>)}</Card></section></div>
  </div>
}
