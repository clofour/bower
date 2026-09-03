import { redirect } from 'next/navigation'
import { ScrollText } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { getAuditLog, getUserOrganization } from '@/lib/queries'
import { Card } from '@/components/ui/card'
import { PageHeading } from '@/components/page-heading'

export default async function AuditPage() {
  const user = await getCurrentUser(); if (!user) redirect('/login')
  const ctx = await getUserOrganization(user.id); if (!ctx) redirect('/login')
  const entries = await getAuditLog(ctx.org.id, 100)
  return <div className="mx-auto max-w-5xl"><PageHeading eyebrow="Organization" title="Audit log" description="An append-only trail of configuration and deployment changes." />
    <Card className="overflow-hidden">{entries.length === 0 ? <div className="grid place-items-center py-20 text-center"><ScrollText className="h-6 w-6 text-primary" /><p className="mt-3 text-sm text-muted-foreground">Activity will appear as your team changes Bower.</p></div> : <div className="divide-y">{entries.map(({ entry, userName }) => <div key={entry.id} className="grid gap-2 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto]"><div><p className="text-sm"><b>{userName ?? 'System'}</b> <span className="text-muted-foreground">{entry.action.replaceAll('.', ' ')}</span></p><p className="mt-1 font-mono text-[11px] text-muted-foreground">{entry.resourceType} / {entry.resourceId}</p></div><time className="text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</time></div>)}</div>}</Card>
  </div>
}
