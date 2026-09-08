import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import {
  getUserOrganization,
  getProjectBySlug,
  getSecretsByProject,
  getEnvironmentsByProject,
} from '@/lib/queries'
import { setSecretAction, deleteSecretAction } from '@/lib/actions/operations'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { KeyRound } from 'lucide-react'
import { SecretActions } from './secret-actions'
import { CreateSecretDialog } from './create-secret-dialog'

function formatDate(date: Date | string | null): string {
  if (!date) return 'Never'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function SecretsPage({
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

  const [secrets, environments] = await Promise.all([
    getSecretsByProject(project.id),
    getEnvironmentsByProject(project.id),
  ])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Secrets</h2>
        <CreateSecretDialog
          projectId={project.id}
          environments={environments.map((e) => ({ id: e.id, name: e.name }))}
        />
      </div>

      {secrets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <KeyRound className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="font-medium text-lg">No secrets</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add secrets to provide sensitive configuration to your services.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Environment</TableHead>
              <TableHead>Shared Group</TableHead>
              <TableHead>Last Rotated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {secrets.map((row) => (
              <TableRow key={row.secret.id}>
                <TableCell className="font-mono text-sm font-medium">
                  {row.secret.name}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{row.environmentName}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {row.sharedName ?? '-'}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDate(row.secret.lastRotatedAt)}
                </TableCell>
                <TableCell className="text-right">
                  <SecretActions
                    projectId={project.id}
                    secretId={row.secret.id}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
