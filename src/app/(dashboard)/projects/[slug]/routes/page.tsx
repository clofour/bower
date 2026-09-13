import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import {
  getUserOrganization,
  getProjectBySlug,
  getRoutesByProject,
} from '@/lib/queries'
import { Panel, SectionTitle } from '@/components/ui/panel'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Globe } from 'lucide-react'

const tlsBadgeVariant: Record<string, 'success' | 'secondary' | 'outline'> = {
  auto: 'success',
  custom: 'secondary',
  none: 'outline',
}

export default async function RoutesPage({
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

  const routes = await getRoutesByProject(project.id)

  return (
    <div className="space-y-5">
      <SectionTitle>Routes</SectionTitle>

      {routes.length === 0 ? (
        <Panel>
          <EmptyState
            icon={<Globe className="h-4 w-4" />}
            title="No routes configured"
            body="Add a route to expose your services to traffic."
          />
        </Panel>
      ) : (
        <Panel>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domain</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Port</TableHead>
                <TableHead>TLS Mode</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routes.map((row) => (
                <TableRow key={row.route.id}>
                  <TableCell className="font-medium">{row.route.domain}</TableCell>
                  <TableCell className="font-mono text-xs text-ink-muted">
                    {row.route.pathPrefix}
                  </TableCell>
                  <TableCell>{row.serviceName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{row.environmentName}</Badge>
                  </TableCell>
                  <TableCell>{row.route.port}</TableCell>
                  <TableCell>
                    <Badge variant={tlsBadgeVariant[row.route.tlsMode] ?? 'outline'}>
                      {row.route.tlsMode}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
      )}
    </div>
  )
}
