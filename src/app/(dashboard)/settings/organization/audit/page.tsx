import { redirect } from 'next/navigation'
import { ClipboardList } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { getUserOrganization, getAuditLog } from '@/lib/queries'
import { Card } from '@/components/ui/card'

export default async function AuditLogPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const ctx = await getUserOrganization(user.id)
  if (!ctx) redirect('/login')

  const entries = await getAuditLog(ctx.org.id)

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track all actions across your organization
        </p>
      </div>

      {entries.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <ClipboardList className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No activity yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Actions will be recorded here as they occur.
          </p>
        </Card>
      ) : (
        <div className="space-y-1">
          {entries.map((entry) => (
            <div
              key={entry.entry.id}
              className="flex items-start gap-3 rounded-md px-3 py-2.5 hover:bg-muted/50 transition-colors"
            >
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
                <ClipboardList className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-medium">{entry.userName ?? 'System'}</span>{' '}
                  <span className="text-muted-foreground">{entry.entry.action}</span>{' '}
                  <span className="font-mono text-xs text-muted-foreground">
                    {entry.entry.resourceType}/{entry.entry.resourceId}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(entry.entry.createdAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
