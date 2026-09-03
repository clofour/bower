import { notFound, redirect } from 'next/navigation'
import { KeyRound, Plus, Trash2 } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { getEnvironmentsByProject, getProjectBySlug, getSecretsByProject, getUserOrganization } from '@/lib/queries'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { NoopButton } from '@/components/noop-button'
import { Input } from '@/components/ui/input'
import { deleteSecretAction, setSecretAction } from '@/lib/actions/operations'

export default async function SecretsPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser(); if (!user) redirect('/login')
  const ctx = await getUserOrganization(user.id); if (!ctx) redirect('/login')
  const { slug } = await params; const project = await getProjectBySlug(ctx.org.id, slug); if (!project) notFound()
  const [items, envs] = await Promise.all([getSecretsByProject(project.id), getEnvironmentsByProject(project.id)])
  return <div><div className="mb-6 flex items-end justify-between"><div><h2 className="text-lg font-bold">Secrets</h2><p className="text-sm text-muted-foreground">Values are written directly to Trellis and never stored by Bower.</p></div><div className="flex gap-2"><NoopButton feature="Restart consumers after secret rotation">Restart consumers</NoopButton><details className="relative"><summary className="list-none"><Button asChild><span><Plus className="mr-2 h-4 w-4" />Add secret</span></Button></summary><Card className="absolute right-0 z-20 mt-2 w-80 p-5 shadow-xl"><form action={setSecretAction.bind(null, project.id)} className="space-y-3"><select name="environmentId" className="h-9 w-full rounded-md border bg-background px-3 text-sm" required><option value="">Choose environment</option>{envs.map((env) => <option key={env.id} value={env.id}>{env.name}</option>)}</select><Input name="name" placeholder="DATABASE_URL" required /><Input name="value" type="password" placeholder="Secret value" required /><Input name="sharedName" placeholder="Optional shared logical name" /><Button className="w-full">Store in Trellis</Button></form></Card></details></div></div>
    {items.length === 0 ? <Card className="grid place-items-center py-16 text-center"><div><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10"><KeyRound className="h-5 w-5 text-primary" /></span><h3 className="mt-4 font-bold">No secrets yet</h3><p className="mt-1 text-sm text-muted-foreground">Add environment-scoped credentials without exposing their values.</p></div></Card> : <div className="grid gap-3">{items.map(({ secret, environmentName, sharedName }) => <Card key={secret.id} className="flex items-center justify-between p-5"><div><p className="font-mono text-sm font-bold">{secret.name}</p><p className="mt-1 text-xs text-muted-foreground">{environmentName}{sharedName ? ` · shared as ${sharedName}` : ''} · rotated {secret.lastRotatedAt ? new Date(secret.lastRotatedAt).toLocaleDateString() : 'never'}</p></div><form action={deleteSecretAction.bind(null, project.id, secret.id)}><Button size="icon" variant="ghost"><Trash2 className="h-4 w-4" /></Button></form></Card>)}</div>}
  </div>
}
