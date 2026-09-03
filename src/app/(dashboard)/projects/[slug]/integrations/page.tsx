import { notFound, redirect } from 'next/navigation'
import { BellRing, GitBranch, Radio, Trash2 } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { getEnvironmentsByProject, getProjectBySlug, getProjectIntegrations, getServicesByProject, getUserOrganization } from '@/lib/queries'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NoopButton } from '@/components/noop-button'
import { CreateWebhookForm } from '@/components/create-webhook-form'
import { createNotificationChannelAction, deleteNotificationChannelAction, deleteWebhookAction } from '@/lib/actions/integrations'

export default async function IntegrationsPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser(); if (!user) redirect('/login')
  const ctx = await getUserOrganization(user.id); if (!ctx) redirect('/login')
  const { slug } = await params; const project = await getProjectBySlug(ctx.org.id, slug); if (!project) notFound()
  const [{ hooks, channels }, serviceList, environmentList] = await Promise.all([getProjectIntegrations(project.id), getServicesByProject(project.id), getEnvironmentsByProject(project.id)])
  return <div className="space-y-6"><div><h2 className="text-lg font-bold">Integrations</h2><p className="text-sm text-muted-foreground">Signed inbound deployments and outbound status delivery.</p></div>
    <div className="grid gap-5 xl:grid-cols-2">
      <Card className="p-6"><div className="flex items-center gap-3"><GitBranch className="h-5 w-5 text-primary" /><div><h3 className="font-bold">Inbound deployments</h3><p className="text-xs text-muted-foreground">Docker Hub, GHCR, or a generic image payload.</p></div></div><div className="mt-5"><CreateWebhookForm projectId={project.id} services={serviceList} environments={environmentList} /></div><div className="mt-5 space-y-2">{hooks.map(({ hook, serviceName, environmentName }) => <div key={hook.id} className="flex items-center justify-between rounded-xl border p-3 text-sm"><div><b>{serviceName}</b> → {environmentName}<p className="font-mono text-xs text-muted-foreground">{hook.provider} · {hook.deployMode} · {hook.tokenPrefix}…</p></div><form action={deleteWebhookAction.bind(null, project.id, hook.id)}><Button size="icon" variant="ghost"><Trash2 className="h-4 w-4" /></Button></form></div>)}</div></Card>
      <Card className="p-6"><div className="flex items-center gap-3"><BellRing className="h-5 w-5 text-primary" /><div><h3 className="font-bold">Deployment notifications</h3><p className="text-xs text-muted-foreground">Slack, Discord, or generic HTTPS delivery.</p></div></div><form action={createNotificationChannelAction.bind(null, project.id)} className="mt-5 space-y-3"><Input name="name" placeholder="Release alerts" required /><div className="grid grid-cols-[120px_1fr] gap-2"><select name="type" className="h-9 rounded-md border bg-background px-2 text-sm"><option value="slack">Slack</option><option value="discord">Discord</option><option value="http">HTTP</option></select><Input name="url" type="url" placeholder="https://…" required /></div><Button className="w-full">Add channel</Button></form><div className="mt-5 space-y-2">{channels.map((channel) => <div key={channel.id} className="flex items-center justify-between rounded-xl border p-3 text-sm"><div><b>{channel.name}</b><p className="text-xs capitalize text-muted-foreground">{channel.type}</p></div><form action={deleteNotificationChannelAction.bind(null, project.id, channel.id)}><Button size="icon" variant="ghost"><Trash2 className="h-4 w-4" /></Button></form></div>)}</div></Card>
    </div>
    <Card className="flex items-center justify-between p-5"><div className="flex items-center gap-3"><Radio className="h-5 w-5 text-primary" /><div><h3 className="font-bold">Real-time Trellis event stream</h3><p className="text-sm text-muted-foreground">Bower polls while Trellis SSE is unavailable.</p></div></div><NoopButton feature="Trellis real-time events">Unavailable</NoopButton></Card>
  </div>
}
