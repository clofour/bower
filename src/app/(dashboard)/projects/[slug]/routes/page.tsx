import { redirect, notFound } from 'next/navigation'
import { Route, Globe } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import {
  getUserOrganization,
  getProjectBySlug,
  getRoutesByProject,
} from '@/lib/queries'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
  if (!project) notFound()

  const routeList = await getRoutesByProject(project.id)

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Routes</h2>
        <p className="text-sm text-muted-foreground">
          Route traffic to services via the managed Caddy reverse proxy.
        </p>
      </div>

      {routeList.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Globe className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No routes configured</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Routes will appear here once you configure domain routing.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {routeList.map((r) => (
            <Card key={r.route.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium font-mono text-sm">
                      {r.route.domain}
                      {r.route.pathPrefix !== '/' && r.route.pathPrefix}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {r.route.tlsMode}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    → {r.serviceName} ({r.environmentName}) :{r.route.port}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
