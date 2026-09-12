import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import {
  getUserOrganization,
  getProjectBySlug,
  getProjectIntegrations,
} from '@/lib/queries'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Webhook, Bell } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

export default async function IntegrationsPage({
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
  if (!project) redirect('/projects')

  const { hooks, channels } = await getProjectIntegrations(project.id)

  return (
    <div className="space-y-8">
      {/* Webhooks section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Webhook className="h-5 w-5" />
          Webhooks
        </h2>

        {hooks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-sm text-ink-muted">
                No webhook endpoints configured.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Deploy Mode</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hooks.map((row) => (
                <TableRow key={row.hook.id}>
                  <TableCell className="font-medium">
                    {row.serviceName}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{row.environmentName}</Badge>
                  </TableCell>
                  <TableCell className="capitalize">
                    {row.hook.provider}
                  </TableCell>
                  <TableCell className="text-sm text-ink-muted">
                    {row.hook.deployMode.replace(/_/g, ' ')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.hook.isActive ? 'success' : 'outline'}>
                      {row.hook.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Separator />

      {/* Notification Channels section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Channels
        </h2>

        {channels.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-sm text-ink-muted">
                No notification channels configured.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channels.map((channel) => (
                <TableRow key={channel.id}>
                  <TableCell className="font-medium">{channel.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {channel.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={channel.isActive ? 'success' : 'outline'}
                    >
                      {channel.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
