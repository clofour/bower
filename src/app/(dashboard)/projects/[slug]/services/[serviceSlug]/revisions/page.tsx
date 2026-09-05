import { notFound, redirect } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { getEnvironmentsByProject, getProjectBySlug, getServiceBySlug, getUserOrganization } from '@/lib/queries'
import { getTrellisClient } from '@/lib/trellis-instance'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { TrellisJobRevision } from '@/types/trellis'

export default async function RevisionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; serviceSlug: string }>
  searchParams: Promise<{ environment?: string }>
}) {
  const user = await getCurrentUser(); if (!user) redirect('/login')
  const ctx = await getUserOrganization(user.id); if (!ctx) redirect('/login')
  const { slug, serviceSlug } = await params
  const project = await getProjectBySlug(ctx.org.id, slug); if (!project) notFound()
  const service = await getServiceBySlug(project.id, serviceSlug); if (!service) notFound()
  const envs = await getEnvironmentsByProject(project.id)
  const selectedSlug = (await searchParams).environment ?? envs[0]?.slug
  const env = envs.find((e) => e.slug === selectedSlug) ?? envs[0]
  let revisions: TrellisJobRevision[] = []
  let error = ''
  if (env && ctx.org.trellisApiUrl && ctx.org.trellisApiToken) {
    try {
      const client = await getTrellisClient(ctx.org.id)
      revisions = await client.getJobRevisions(service.slug, env.trellisNamespace)
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unable to reach Trellis.'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <a href={`/projects/${slug}/services/${serviceSlug}`}>
          <Button variant="ghost" size="sm"><ChevronLeft className="mr-1 h-4 w-4" />Back</Button>
        </a>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.2em] text-primary">{service.name}</p>
          <h2 className="text-2xl font-black tracking-[-.04em]">Revision history</h2>
          {env && <p className="mt-0.5 text-sm text-muted-foreground">Persisted Trellis job revisions · {env.name}</p>}
        </div>
      </div>

      {envs.length > 1 && (
        <div className="flex gap-2 overflow-x-auto rounded-xl border bg-muted/40 p-1.5">
          {envs.map((e) => (
            <a key={e.id} href={`?environment=${e.slug}`}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${e.slug === selectedSlug ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              {e.name}
            </a>
          ))}
        </div>
      )}

      {error ? (
        <Card className="border-amber-500/20 bg-amber-500/5 p-5 text-sm text-amber-700 dark:text-amber-300">{error}</Card>
      ) : revisions.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No revisions found for this job.</Card>
      ) : (
        <div className="space-y-3">
          {[...revisions].reverse().map((rev) => (
            <Card key={rev.revision} className="p-5">
              <div className="flex items-center justify-between">
                <p className="font-mono text-sm font-semibold">Revision {rev.revision}</p>
                <p className="text-xs text-muted-foreground">{new Date(rev.created_at).toLocaleString()}</p>
              </div>
              <pre className="mt-3 overflow-x-auto rounded-lg bg-muted p-3 text-xs">{JSON.stringify(rev.spec, null, 2)}</pre>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
