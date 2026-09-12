import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { getUserOrganization, getProjectsForUser, getServicesByProject } from '@/lib/queries'
import { PageHeading } from '@/components/page-heading'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreateProjectDialog } from '@/components/create-project-dialog'
import { FolderKanban, ArrowRight } from 'lucide-react'

export default async function ProjectsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const orgCtx = await getUserOrganization(user.id)
  if (!orgCtx) redirect('/login')

  const clusterConfigured = Boolean(orgCtx.org.trellisApiUrl && orgCtx.org.trellisApiToken)
  const projectList = await getProjectsForUser(orgCtx.org.id, user.id, orgCtx.role)

  // Fetch service counts for each project in parallel
  const serviceCounts = await Promise.all(
    projectList.map(async (project) => {
      const svc = await getServicesByProject(project.id)
      return { projectId: project.id, count: svc.length }
    })
  )
  const serviceCountMap = new Map(serviceCounts.map((s) => [s.projectId, s.count]))

  return (
    <div className="space-y-6">
      <PageHeading
        title="Projects"
        description="Manage your deployment projects"
        actions={clusterConfigured ? <CreateProjectDialog /> : undefined}
      />

      {projectList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sunken">
            <FolderKanban className="h-6 w-6 text-ink-muted" />
          </div>
          <h3 className="mb-1 text-sm font-medium">No projects yet</h3>
          <p className="mb-4 text-sm text-ink-muted">
            {clusterConfigured
              ? 'Create your first project to start deploying services.'
              : 'Connect a Trellis cluster in Settings to start creating projects.'}
          </p>
          {clusterConfigured && <CreateProjectDialog />}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projectList.map((project) => (
            <Link key={project.id} href={`/projects/${project.slug}`} className="group">
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{project.name}</CardTitle>
                    <ArrowRight className="h-4 w-4 text-ink-muted opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  {project.description && (
                    <CardDescription className="line-clamp-2">
                      {project.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 text-sm text-ink-muted">
                    <Badge variant="secondary">
                      {serviceCountMap.get(project.id) ?? 0}{' '}
                      {(serviceCountMap.get(project.id) ?? 0) === 1 ? 'service' : 'services'}
                    </Badge>
                    <span>
                      Created{' '}
                      {new Date(project.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
