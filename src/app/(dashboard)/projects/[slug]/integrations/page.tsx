import { notFound, redirect } from 'next/navigation'
import { BellRing, GitBranch, Radio } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { getProjectBySlug, getProjectIntegrations, getUserOrganization } from '@/lib/queries'
import { Card } from '@/components/ui/card'
import { NoopButton } from '@/components/noop-button'

export default async function IntegrationsPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser(); if (!user) redirect('/login')
  const ctx = await getUserOrganization(user.id); if (!ctx) redirect('/login')
  const { slug } = await params; const project = await getProjectBySlug(ctx.org.id, slug); if (!project) notFound()
  const { hooks, channels } = await getProjectIntegrations(project.id)
  const cards = [
    { icon: GitBranch, title: 'Inbound deployments', detail: `${hooks.length} webhook endpoint${hooks.length === 1 ? '' : 's'}`, action: 'Webhook provisioning' },
    { icon: BellRing, title: 'Deployment notifications', detail: `${channels.length} notification channel${channels.length === 1 ? '' : 's'}`, action: 'Notification channels' },
    { icon: Radio, title: 'Real-time event stream', detail: 'Polling Trellis until SSE becomes available', action: 'Trellis real-time events' },
  ]
  return <div><div className="mb-6"><h2 className="text-lg font-bold">Integrations</h2><p className="text-sm text-muted-foreground">Connect delivery pipelines and deployment notifications.</p></div><div className="grid gap-4 md:grid-cols-3">{cards.map(({ icon: Icon, title, detail, action }) => <Card key={title} className="p-5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10"><Icon className="h-4 w-4 text-primary" /></span><h3 className="mt-5 font-bold">{title}</h3><p className="mt-1 min-h-10 text-sm leading-5 text-muted-foreground">{detail}</p><NoopButton feature={action} className="mt-5 w-full">Configure</NoopButton></Card>)}</div></div>
}
