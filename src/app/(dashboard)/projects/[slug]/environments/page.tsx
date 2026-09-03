import { redirect, notFound } from 'next/navigation'
import { Globe, Lock, LockOpen, Plus, Trash2 } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import {
  getUserOrganization,
  getProjectBySlug,
  getEnvironmentsByProject,
} from '@/lib/queries'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createEnvironmentAction, deleteEnvironmentAction, toggleEnvironmentLockAction, updateEnvironmentAction } from '@/lib/actions/operations'
import { Textarea } from '@/components/ui/textarea'

export default async function EnvironmentsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const ctx = await getUserOrganization(user.id)
  if (!ctx) redirect('/login')

  const { slug } = await params
  const project = await getProjectBySlug(ctx.org.id, slug)
  if (!project) notFound()

  const envList = await getEnvironmentsByProject(project.id)

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
        <h2 className="text-lg font-semibold">Environments</h2>
        <p className="text-sm text-muted-foreground">
          Environments map to Trellis namespaces and define the promotion pipeline.
        </p>
        </div>
        <details className="group relative"><summary className="list-none"><Button asChild><span><Plus className="mr-2 h-4 w-4" />New environment</span></Button></summary><Card className="absolute right-0 z-20 mt-2 w-80 p-4 shadow-xl"><form action={createEnvironmentAction.bind(null, project.id)} className="space-y-3"><Input name="name" placeholder="Preview" required /><Input name="replicas" type="number" min="0" defaultValue="1" /><select name="resourceTier" className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="small">Small resources</option><option value="medium">Medium</option><option value="large">Large</option><option value="xl">XL</option></select><Textarea name="envVars" placeholder={'Environment variables\nLOG_LEVEL=debug'} /><Button className="w-full">Create environment</Button></form></Card></details>
      </div>

      <div className="space-y-3">
        {envList.map((env, i) => (
          <Card key={env.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{env.name}</h3>
                    {env.isLocked && (
                      <Lock className="h-3.5 w-3.5 text-amber-500" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    {env.trellisNamespace}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{env.resourceTier} · replicas {env.defaultReplicas} · order {env.promotionOrder}</span>
                <details><summary className="list-none"><Button size="sm" variant="outline" asChild><span>Edit</span></Button></summary><Card className="absolute right-16 z-20 mt-2 w-80 p-4 shadow-xl"><form action={updateEnvironmentAction.bind(null, project.id, env.id)} className="space-y-3"><Input name="replicas" type="number" min="0" defaultValue={env.defaultReplicas} /><Input name="promotionOrder" type="number" min="0" defaultValue={env.promotionOrder} /><select name="resourceTier" defaultValue={env.resourceTier} className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option><option value="xl">XL</option><option value="custom">Custom</option></select><Textarea name="envVars" defaultValue={Object.keys(env.envVars as Record<string,string>).map((key) => `${key}=`).join('\n')} placeholder={'KEY=new value\nLeave existing values blank'} /><p className="text-xs text-muted-foreground">Values go directly to namespace secrets; blanks preserve existing values.</p><Button className="w-full">Save overrides</Button></form></Card></details>
                <form action={toggleEnvironmentLockAction.bind(null, project.id, env.id, !env.isLocked)}><Button size="sm" variant="ghost">{env.isLocked ? <><LockOpen className="mr-2 h-3.5 w-3.5" />Unlock</> : <><Lock className="mr-2 h-3.5 w-3.5" />Lock</>}</Button></form>
                <form action={deleteEnvironmentAction.bind(null, project.id, env.id)}><Button size="icon" variant="ghost" aria-label={`Delete ${env.name}`}><Trash2 className="h-3.5 w-3.5" /></Button></form>
                {i < envList.length - 1 && (
                  <span className="text-xs">→</span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
