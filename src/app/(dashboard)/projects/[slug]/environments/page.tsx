import { redirect, notFound } from 'next/navigation'
import { Globe, Lock } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import {
  getUserOrganization,
  getProjectBySlug,
  getEnvironmentsByProject,
} from '@/lib/queries'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function EnvironmentsPage({
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

  const envList = await getEnvironmentsByProject(project.id)

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Environments</h2>
        <p className="text-sm text-muted-foreground">
          Environments map to Trellis namespaces and define the promotion pipeline.
        </p>
      </div>

      <div className="space-y-3">
        {envList.map((env, i) => (
          <Card key={env.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{env.name}</h3>
                    {env.isLocked && (
                      <Lock className="h-3.5 w-3.5 text-amber-500" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    {env.trellisNamespace}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>Replicas: {env.defaultReplicas}</span>
                {i < envList.length - 1 && (
                  <span className="text-xs">→</span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
