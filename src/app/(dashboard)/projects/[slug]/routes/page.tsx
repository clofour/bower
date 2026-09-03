import { redirect, notFound } from 'next/navigation'
import { Globe, Plus, Trash2 } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import {
  getUserOrganization,
  getProjectBySlug,
  getRoutesByProject,
  getServicesByProject,
  getEnvironmentsByProject,
} from '@/lib/queries'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createRouteAction, deleteRouteAction } from '@/lib/actions/operations'

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

  const [routeList, serviceList, environmentList] = await Promise.all([getRoutesByProject(project.id), getServicesByProject(project.id), getEnvironmentsByProject(project.id)])

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
        <h2 className="text-lg font-semibold">Routes</h2>
        <p className="text-sm text-muted-foreground">
          Route traffic to services via the managed Caddy reverse proxy.
        </p>
        </div>
        <details className="group relative"><summary className="list-none"><Button asChild><span><Plus className="mr-2 h-4 w-4" />Add route</span></Button></summary><Card className="absolute right-0 z-20 mt-2 w-[360px] p-5 shadow-xl"><form action={createRouteAction.bind(null, project.id)} className="space-y-3"><Input name="domain" placeholder="api.example.com" required /><Input name="pathPrefix" defaultValue="/" /><div className="grid grid-cols-2 gap-2"><select name="serviceId" className="h-9 rounded-md border bg-background px-3 text-sm" required><option value="">Service</option>{serviceList.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select><select name="environmentId" className="h-9 rounded-md border bg-background px-3 text-sm" required><option value="">Environment</option>{environmentList.map((env) => <option key={env.id} value={env.id}>{env.name}</option>)}</select></div><div className="grid grid-cols-2 gap-2"><Input name="port" type="number" defaultValue="8080" /><select name="tlsMode" className="h-9 rounded-md border bg-background px-3 text-sm"><option value="auto">Automatic TLS</option><option value="custom">Custom TLS</option><option value="none">No TLS</option></select></div><Button className="w-full">Create route</Button><p className="text-xs leading-5 text-muted-foreground">Canopy records the route and will provision the managed proxy when proxy packaging is configured.</p></form></Card></details>
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
                <form action={deleteRouteAction.bind(null, project.id, r.route.id)}><Button size="icon" variant="ghost" aria-label="Delete route"><Trash2 className="h-4 w-4 text-muted-foreground" /></Button></form>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
