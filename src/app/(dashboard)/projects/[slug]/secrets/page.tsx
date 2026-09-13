import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import {
  getUserOrganization,
  getProjectBySlug,
  getSecretsByProject,
  getEnvironmentsByProject,
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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <SectionTitle>Secrets</SectionTitle>
        <CreateSecretDialog
          projectId={project.id}
          environments={environments.map((e) => ({ id: e.id, name: e.name }))}
        />
      </div>

      {secrets.length === 0 ? (
        <Panel>
          <EmptyState
            icon={<KeyRound className="h-4 w-4" />}
            title="No secrets"
            body="Add secrets to provide sensitive configuration to your services."
          />
        </Panel>
      ) : (
        <Panel>
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
                  <TableCell className="text-ink-muted">
                    {row.sharedName ?? '-'}
                  </TableCell>
                  <TableCell className="text-ink-muted text-sm">
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
        </Panel>
      )}
    </div>
  )
}
