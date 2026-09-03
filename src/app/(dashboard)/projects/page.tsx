import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FolderKanban } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { getUserOrganization, getProjectsByOrg } from '@/lib/queries'
import { Card } from '@/components/ui/card'
import { CreateProjectDialog } from '@/components/create-project-dialog'

export default async function ProjectsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const ctx = await getUserOrganization(user.id)
  if (!ctx) redirect('/login')

  const projectList = await getProjectsByOrg(ctx.org.id)

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your deployment projects
          </p>
        </div>
        <CreateProjectDialog />
      </div>

      {projectList.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <FolderKanban className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first project to get started.
          </p>
          <CreateProjectDialog />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projectList.map((project) => (
            <Link key={project.id} href={`/projects/${project.slug}`}>
              <Card className="group relative flex h-full flex-col p-5 transition-colors hover:border-primary/40">
                <div className="flex items-start justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                    <FolderKanban className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <h3 className="mt-3 font-semibold tracking-tight group-hover:text-primary transition-colors">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {project.description}
                  </p>
                )}
                <div className="mt-auto pt-4">
                  <p className="text-xs text-muted-foreground">
                    Updated{' '}
                    {new Date(project.updatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
