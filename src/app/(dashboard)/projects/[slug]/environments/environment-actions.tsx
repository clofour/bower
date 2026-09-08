'use client'

import { useState, useTransition } from 'react'
import { createEnvironmentAction, deleteEnvironmentAction, toggleEnvironmentLockAction, updateEnvironmentAction } from '@/lib/actions/operations'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus } from 'lucide-react'

type Environment = { id: string; name: string; isLocked: boolean; defaultReplicas: number; promotionOrder: number; resourceTier: string; envVars: unknown }

function Fields({ environment }: { environment?: Environment }) {
  const keys = Object.keys((environment?.envVars ?? {}) as Record<string, string>)
  return <div className="space-y-4">
    {!environment && <div className="space-y-2"><Label htmlFor="environment-name">Name</Label><Input id="environment-name" name="name" placeholder="Production" required /></div>}
    <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="environment-replicas">Default replicas</Label><Input id="environment-replicas" name="replicas" type="number" min="0" defaultValue={environment?.defaultReplicas ?? 1} required /></div><div className="space-y-2"><Label htmlFor="environment-tier">Resource tier</Label><select id="environment-tier" name="resourceTier" defaultValue={environment?.resourceTier ?? 'small'} className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option><option value="xl">XL</option><option value="custom">Custom</option></select></div></div>
    {environment && <div className="space-y-2"><Label htmlFor="environment-order">Promotion order</Label><Input id="environment-order" name="promotionOrder" type="number" min="0" defaultValue={environment.promotionOrder} required /></div>}
    <div className="space-y-2"><Label htmlFor="environment-variables">Environment variables</Label><Textarea id="environment-variables" name="envVars" className="min-h-28 font-mono text-xs" defaultValue={keys.map((key) => `${key}=`).join('\n')} placeholder={'LOG_LEVEL=info\nFEATURE_FLAG=true'} /><p className="text-xs leading-5 text-muted-foreground">One KEY=value per line. Existing values are write-only; leave the value blank to keep it unchanged.</p></div>
  </div>
}

export function CreateEnvironmentDialog({ projectId, prominent = false }: { projectId: string; prominent?: boolean }) {
  const [open, setOpen] = useState(false); const [pending, start] = useTransition(); const [error, setError] = useState<string | null>(null)
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button variant={prominent ? 'default' : 'outline'} size={prominent ? 'default' : 'sm'}><Plus />New environment</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>New environment</DialogTitle></DialogHeader><form className="space-y-5" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); setError(null); start(async () => { try { await createEnvironmentAction(projectId, data); setOpen(false) } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not create the environment.') } }) }}><Fields />{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button disabled={pending} className="w-full">{pending ? 'Creating…' : 'Create environment'}</Button></form></DialogContent></Dialog>
}

export function EnvironmentActions({ projectId, environment }: { projectId: string; environment: Environment }) {
  const [open, setOpen] = useState(false); const [pending, start] = useTransition(); const [error, setError] = useState<string | null>(null)
  const run = (operation: () => Promise<unknown>) => { setError(null); start(async () => { try { await operation() } catch (cause) { setError(cause instanceof Error ? cause.message : 'The environment could not be updated.') } }) }
  return <div className="flex items-center justify-end gap-1"><Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button variant="ghost" size="sm">Edit</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Edit {environment.name}</DialogTitle></DialogHeader><form className="space-y-5" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); run(async () => { await updateEnvironmentAction(projectId, environment.id, data); setOpen(false) }) }}><Fields environment={environment} />{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button disabled={pending} className="w-full">{pending ? 'Saving…' : 'Save changes'}</Button></form></DialogContent></Dialog>
    <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="sm">{environment.isLocked ? 'Unlock' : 'Lock'}</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{environment.isLocked ? 'Unlock' : 'Lock'} {environment.name}?</AlertDialogTitle><AlertDialogDescription>{environment.isLocked ? 'Deployments and configuration changes will be allowed again.' : 'Deployments and configuration changes will be blocked. Running workloads are not stopped.'}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => run(() => toggleEnvironmentLockAction(projectId, environment.id, !environment.isLocked))}>{environment.isLocked ? 'Unlock environment' : 'Lock environment'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="text-destructive">Delete</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete {environment.name}?</AlertDialogTitle><AlertDialogDescription>This removes its Trellis namespace, proxy job, and stored variables. Environments with project services cannot be deleted.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-white" onClick={() => run(() => deleteEnvironmentAction(projectId, environment.id))}>Delete environment</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>{pending && <span className="sr-only" role="status">Updating environment…</span>}{error && <span className="sr-only" role="alert">{error}</span>}</div>
}
