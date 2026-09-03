import { redirect, notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getUserOrganization, getProjectBySlug } from '@/lib/queries'
import { Card } from '@/components/ui/card'
import { DeleteProjectButton } from '@/components/delete-project-button'

export default async function ProjectSettingsPage({
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
  if (!project) notFound()

  const canDelete = ctx.role === 'owner' || ctx.role === 'admin'

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Project Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage project configuration and danger zone.
        </p>
      </div>

      <Card className="p-5">
        <h3 className="font-medium">General</h3>
        <div className="mt-4 space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="text-sm font-medium">{project.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Slug</p>
            <p className="text-sm font-mono">{project.slug}</p>
          </div>
          {project.description && (
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="text-sm">{project.description}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Created</p>
            <p className="text-sm">
              {new Date(project.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </Card>

      {canDelete && (
        <Card className="border-destructive/30 p-5">
          <h3 className="font-medium text-destructive">Danger Zone</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Deleting this project will permanently remove all services,
            environments, deployments, and routes. This cannot be undone.
          </p>
          <div className="mt-4">
            <DeleteProjectButton
              projectId={project.id}
              projectName={project.name}
            />
          </div>
        </Card>
      )}
    </div>
  )
}
