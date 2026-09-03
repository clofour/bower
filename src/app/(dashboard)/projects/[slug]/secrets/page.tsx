import { redirect, notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { ShieldCheck, AlertTriangle } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { getUserOrganization, getProjectBySlug, getEnvironmentsByProject } from '@/lib/queries'
import { db } from '@/db'
import { secretsMetadata } from '@/db/schema'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function SecretsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const ctx = await getUserOrganization(user.id)
  if (!ctx) redirect('/login')

  const isTrellisConfigured = !!(ctx.org.trellisApiUrl && ctx.org.trellisApiToken)

  const { slug } = await params
  const project = await getProjectBySlug(ctx.org.id, slug)
  if (!project) notFound()

  const secrets = await db
    .select()
    .from(secretsMetadata)
    .where(eq(secretsMetadata.projectId, project.id))

  const envList = await getEnvironmentsByProject(project.id)

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Secrets</h2>
        <p className="text-sm text-muted-foreground">
          Secret values are stored in Trellis. Canopy tracks metadata only.
        </p>
      </div>

      {!isTrellisConfigured ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Trellis not configured</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure Trellis credentials to manage secrets.
          </p>
        </Card>
      ) : secrets.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <ShieldCheck className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No secrets tracked</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Secrets will appear here when added via the Trellis API.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {secrets.map((s) => {
            const env = envList.find((e) => e.id === s.environmentId)
            return (
              <Card key={s.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{s.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono">
                      {s.trellisSecretName}
                    </p>
                  </div>
                  <div className="text-right">
                    {env && (
                      <Badge variant="outline" className="text-xs">
                        {env.name}
                      </Badge>
                    )}
                    {s.lastRotatedAt && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Rotated{' '}
                        {new Date(s.lastRotatedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
