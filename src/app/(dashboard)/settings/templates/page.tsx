import { redirect } from 'next/navigation'
import { Blocks, Database, Globe2, Plus, RadioTower, ServerCog } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { getTemplates, getUserOrganization } from '@/lib/queries'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeading } from '@/components/page-heading'
import { createTemplateAction } from '@/lib/actions/operations'

const builtin = [
  { name: 'Static site', type: 'web', description: 'Caddy-served assets with an HTTP health check.', icon: Globe2 },
  { name: 'API service', type: 'web', description: 'Two replicas, rolling updates, and route-ready defaults.', icon: RadioTower },
  { name: 'Background worker', type: 'worker', description: 'Restart-aware private workload with no exposed port.', icon: ServerCog },
  { name: 'Development database', type: 'custom', description: 'Single replica with a host volume. Not for production.', icon: Database },
]

export default async function TemplatesPage() {
  const user = await getCurrentUser(); if (!user) redirect('/login')
  const ctx = await getUserOrganization(user.id); if (!ctx) redirect('/login')
  const custom = await getTemplates(ctx.org.id)
  return <div className="mx-auto max-w-6xl"><PageHeading eyebrow="Catalog" title="Service templates" description="Opinionated starting points that remain fully editable after creation." actions={<details className="relative"><summary className="list-none"><Button asChild><span><Plus className="mr-2 h-4 w-4" />Custom template</span></Button></summary><Card className="absolute right-0 z-20 mt-2 w-96 p-5 shadow-xl"><form action={createTemplateAction} className="space-y-3"><Input name="name" placeholder="Template name" required /><Input name="description" placeholder="What is this for?" /><select name="type" className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="web">Web</option><option value="worker">Worker</option><option value="custom">Custom</option></select><Input name="image" placeholder="ghcr.io/org/image:tag" required /><div className="grid grid-cols-2 gap-2"><Input name="port" type="number" placeholder="Port" /><Input name="replicas" type="number" min="0" defaultValue="1" /></div><Button className="w-full">Save template</Button></form></Card></details>} />
    <div className="grid gap-4 md:grid-cols-2">{[...builtin, ...custom.map((t) => ({ name: t.name, type: t.type, description: t.description ?? 'Custom organization template.', icon: Blocks }))].map(({ name, type, description, icon: Icon }) => <Card key={`${name}-${type}`} className="group p-6 transition hover:border-primary/30"><div className="flex items-start justify-between"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10"><Icon className="h-5 w-5 text-primary" /></span><span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">{type}</span></div><h2 className="mt-5 text-lg font-bold">{name}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p></Card>)}</div>
  </div>
}
