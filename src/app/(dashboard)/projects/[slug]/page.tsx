import { redirect, notFound } from 'next/navigation'
import { Layers, ArrowUpRight, Boxes } from 'lucide-react'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import {
  getUserOrganization,
  getProjectBySlug,
  getServicesByProject,
} from '@/lib/queries'
import { Card } from '@/components/ui/card'
import { CreateServiceDialog } from '@/components/create-service-dialog'

const typeColors: Record<string, string> = {
  web: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  worker: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  cron: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  custom: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
}

export default async function ProjectServicesPage({
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

  const serviceList = await getServicesByProject(project.id)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Services</h2>
        <CreateServiceDialog projectSlug={slug} />
      </div>

      {serviceList.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Layers className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No services yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add a service to start deploying.
          </p>
          <div className="mt-4">
            <CreateServiceDialog projectSlug={slug} />
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {serviceList.map((svc) => (
            <Link key={svc.id} href={`/projects/${slug}/services/${svc.slug}`}>
            <Card className="group overflow-hidden p-0 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
              <div className="h-1 bg-gradient-to-r from-primary via-cyan-400 to-transparent opacity-60" />
              <div className="flex items-center justify-between p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Boxes className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{svc.name}</h3>
                    <p className="text-xs text-muted-foreground">{svc.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[svc.type] ?? typeColors.custom}`}
                  >
                    {svc.type}
                  </span>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
            </Card></Link>
          ))}
        </div>
      )}
    </div>
  )
}
