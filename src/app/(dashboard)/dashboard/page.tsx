import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import {
  getUserOrganization,
  getProjectsForUser,
  getDeploymentsByProject,
  getServicesByProject,
  getEnvironmentsByProject,
} from '@/lib/queries'
import { PageHeading } from '@/components/page-heading'
import { StatusDot } from '@/components/status'
import { EmptyState } from '@/components/ui/empty-state'
import { CreateProjectDialog } from '@/components/create-project-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FolderKanban, ArrowRight } from 'lucide-react'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const orgCtx = await getUserOrganization(user.id)
  if (!orgCtx) redirect('/login')

  const projectList = await getProjectsForUser(orgCtx.org.id, user.id, orgCtx.role)

  // Gather stats across all projects in parallel
  const projectData = await Promise.all(
    projectList.map(async (project) => {
      const [svc, deploys, envs] = await Promise.all([
        getServicesByProject(project.id),
        getDeploymentsByProject(project.id, 10),
        getEnvironmentsByProject(project.id),
      ])
      return { project, services: svc, deployments: deploys, environments: envs }
    })
  )

  const totalServices = projectData.reduce((sum, d) => sum + d.services.length, 0)
  const allDeployments = projectData.flatMap((d) => d.deployments)
  allDeployments.sort(
    (a, b) =>
      new Date(b.deployment.createdAt).getTime() -
      new Date(a.deployment.createdAt).getTime()
  )
  const recentDeployments = allDeployments.slice(0, 10)
  const totalEnvironments = new Set(
    projectData.flatMap((d) => d.environments.map((e) => e.id))
  ).size

  const recentProjects = projectList.slice(0, 6)
  const activeDeployments = allDeployments.filter((row) => ['pending', 'planning', 'deploying'].includes(row.deployment.status)).length
  const failedDeployments = allDeployments.filter((row) => ['failed', 'rolled_back'].includes(row.deployment.status)).length

  return (
    <div className="space-y-8">
      <PageHeading eyebrow="Operational overview" title={`Good to see you, ${user.name.split(' ')[0]}`} description="Current service posture and recent changes across your organization." />

      <div className="grid overflow-hidden rounded-lg border bg-card lg:grid-cols-[1.6fr_1fr_1fr]">
        <section className="border-b p-6 lg:border-b-0 lg:border-r" aria-labelledby="deployment-posture"><p id="deployment-posture" className="text-xs font-medium uppercase tracking-[.1em] text-muted-foreground">Deployment posture</p><div className="mt-3 flex items-baseline gap-2"><strong className="text-4xl font-semibold tabular">{activeDeployments}</strong><span className="text-sm text-muted-foreground">active</span></div><p className={`mt-3 text-sm ${failedDeployments ? 'font-medium text-destructive' : 'text-muted-foreground'}`}>{failedDeployments ? `${failedDeployments} failed deployment${failedDeployments === 1 ? '' : 's'} need attention` : 'No recent deployment failures'}</p></section>
        <dl className="border-b p-6 lg:border-b-0 lg:border-r"><dt className="text-xs font-medium uppercase tracking-[.1em] text-muted-foreground">Services</dt><dd className="mt-3 text-2xl font-semibold tabular">{totalServices}</dd><dd className="mt-1 text-xs text-muted-foreground">Across {projectList.length} projects</dd></dl>
        <dl className="p-6"><dt className="text-xs font-medium uppercase tracking-[.1em] text-muted-foreground">Environments</dt><dd className="mt-3 text-2xl font-semibold tabular">{totalEnvironments}</dd><dd className="mt-1 text-xs text-muted-foreground">Deployment targets</dd></dl>
      </div>

      {/* Recent projects */}
      {recentProjects.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Recent projects</h2>
            {projectList.length > 6 && (
              <Link
                href="/projects"
                className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                View all
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
          <div className="divide-y border-y">
            {recentProjects.map((project) => {
              const data = projectData.find((d) => d.project.id === project.id)
              return (
                <Link key={project.id} href={`/projects/${project.slug}`} className="group grid gap-1 py-3 transition-colors hover:bg-muted/30 sm:grid-cols-[1fr_2fr_auto] sm:items-center sm:px-3">
                  <span className="font-medium">{project.name}</span>
                  <span className="truncate text-sm text-muted-foreground">{project.description || 'No description'}</span>
                  <span className="flex items-center gap-4 text-xs tabular text-muted-foreground"><span>{data?.services.length ?? 0} services</span><span>{data?.environments.length ?? 0} environments</span><ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent deployments */}
      {recentDeployments.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Recent deployments</h2>
          <div className="overflow-hidden rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Environment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Triggered by</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentDeployments.map((row) => (
                  <TableRow key={row.deployment.id}>
                    <TableCell className="font-medium">{row.serviceName}</TableCell>
                    <TableCell>
                      <span className="text-sm">{row.environmentName}</span>
                    </TableCell>
                    <TableCell>
                      <StatusDot status={row.deployment.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.userName ?? 'System'}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {new Date(row.deployment.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {projectList.length === 0 && (
        <EmptyState icon={<FolderKanban className="h-5 w-5" />} title="Create your first project" description="Projects group services, environments, routes, and deployment history into one operational workspace." action={<CreateProjectDialog prominent />} />
      )}
    </div>
  )
}
