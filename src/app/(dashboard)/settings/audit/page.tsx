import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getUserOrganization, getAuditLog } from '@/lib/queries'
import { PageHeading } from '@/components/page-heading'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ScrollText } from 'lucide-react'

export default async function AuditLogPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const orgCtx = await getUserOrganization(user.id)
  if (!orgCtx) redirect('/login')

  const entries = await getAuditLog(orgCtx.org.id)

  return (
    <div className="space-y-6">
      <PageHeading title="Audit Log" description="Track changes across your organization." />

      {entries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <ScrollText className="h-10 w-10 text-ink-muted/50" />
            <p className="text-ink-muted">No audit entries yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Resource ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e) => (
                <TableRow key={e.entry.id}>
                  <TableCell className="whitespace-nowrap text-ink-muted">
                    {new Date(e.entry.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>{e.userName ?? 'System'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {e.entry.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{e.entry.resourceType}</TableCell>
                  <TableCell className="font-mono text-xs text-ink-muted">
                    {e.entry.resourceId.slice(0, 8)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
