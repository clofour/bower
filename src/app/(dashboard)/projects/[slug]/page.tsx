import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getUserOrganization, getProjectBySlug, getServicesByProject } from '@/lib/queries'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Server } from 'lucide-react'
import { CreateServiceDialog } from '@/components/create-service-dialog'

export default async function ProjectOverviewPage({
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

  const services = await getServicesByProject(project.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Services</h2>
        <CreateServiceDialog projectSlug={slug} />
      </div>

      {services.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Server className="h-10 w-10 text-ink-muted mb-3" />
            <h3 className="font-medium text-lg">No services yet</h3>
            <p className="text-sm text-ink-muted mt-1 max-w-sm">
              Create your first service to start deploying containers with Trellis.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((service) => (
            <Link
              key={service.id}
              href={`/projects/${slug}/services/${service.slug}`}
              className="block"
            >
              <Card className="hover:border-brand-500/50 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{service.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-ink-muted">
                    Created {new Date(service.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
