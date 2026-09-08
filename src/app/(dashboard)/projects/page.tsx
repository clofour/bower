import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { getUserOrganization, getProjectsForUser, getServicesByProject } from '@/lib/queries'
import { PageHeading } from '@/components/page-heading'
import { EmptyState } from '@/components/ui/empty-state'
import { CreateProjectDialog } from '@/components/create-project-dialog'
import { FolderKanban, ArrowUpRight } from 'lucide-react'

export default async function ProjectsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const orgCtx = await getUserOrganization(user.id)
  if (!orgCtx) redirect('/login')

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
        eyebrow="Organization"
        title="Projects"
        description={projectList.length ? `${projectList.length} project${projectList.length === 1 ? '' : 's'} available to you.` : 'Projects contain services and their deployment environments.'}
        actions={projectList.length ? <CreateProjectDialog /> : undefined}
      />

      {projectList.length === 0 ? (
        <EmptyState icon={<FolderKanban className="h-5 w-5" />} title="Create the first project" description="Start with a project, then add environments and services when you are ready to deploy." action={<CreateProjectDialog prominent />} />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          {projectList.map((project) => (
            <Link key={project.id} href={`/projects/${project.slug}`} className="group grid gap-2 border-b px-4 py-4 transition-colors last:border-0 hover:bg-muted/35 sm:grid-cols-[minmax(12rem,1fr)_minmax(14rem,2fr)_8rem_10rem_1.5rem] sm:items-center">
              <span className="font-medium">{project.name}</span>
              <span className="truncate text-sm text-muted-foreground">{project.description || 'No description'}</span>
              <span className="text-sm tabular text-muted-foreground">{serviceCountMap.get(project.id) ?? 0} {(serviceCountMap.get(project.id) ?? 0) === 1 ? 'service' : 'services'}</span>
              <span className="text-xs text-muted-foreground">
                      {new Date(project.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
              </span>
              <ArrowUpRight aria-hidden="true" className="hidden h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 sm:block" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
