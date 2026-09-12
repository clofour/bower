import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { getUserOrganization, getProjectBySlug, getServiceBySlug, getServiceConfigsWithEnvironments } from '@/lib/queries'
import { getTrellisClient } from '@/lib/trellis-instance'
import { PageHeading } from '@/components/page-heading'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusDot } from '@/components/status'
import { ExecDialog } from '@/components/exec-dialog'
import { ArrowLeft } from 'lucide-react'
import type { TrellisAllocation } from '@/types/trellis'

export default async function AllocationDetailPage({
  params,
}: {
  params: Promise<{ slug: string; serviceSlug: string; allocationId: string }>
}) {
  const { slug, serviceSlug, allocationId } = await params
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const orgCtx = await getUserOrganization(user.id)
  if (!orgCtx) redirect('/login')
  const project = await getProjectBySlug(orgCtx.org.id, slug)
  if (!project) notFound()
  const service = await getServiceBySlug(project.id, serviceSlug)
  if (!service) notFound()

  const configs = await getServiceConfigsWithEnvironments(service.id)
  const firstConfig = configs[0]

  const client = await getTrellisClient(orgCtx.org.id)
  let allocation: TrellisAllocation | null = null
  let stdout = ''
  let stderr = ''

  try {
    const allocs = await client.listAllocations()
    allocation = allocs.find((a) => a.id === allocationId) ?? null
    if (!allocation) notFound()
    const [outRes, errRes] = await Promise.all([
      client.getAllocationLogs(allocationId, 'stdout').catch(() => ''),
      client.getAllocationLogs(allocationId, 'stderr').catch(() => ''),
    ])
    stdout = outRes
    stderr = errRes
  } catch {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/projects/${slug}/services/${serviceSlug}`} className="text-ink-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <PageHeading
          title={allocationId.slice(0, 8)}
          eyebrow={service.name}
          actions={
            firstConfig && (
              <ExecDialog allocationId={allocationId} serviceConfigId={firstConfig.config.id} />
            )
          }
        />
      </div>

      {allocation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Allocation details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm md:grid-cols-3">
              <div>
                <span className="text-ink-muted">Phase</span>
                <div className="mt-0.5"><StatusDot status={allocation.phase} /></div>
              </div>
              <div>
                <span className="text-ink-muted">Health</span>
                <div className="mt-0.5"><StatusDot status={allocation.health} /></div>
              </div>
              <div>
                <span className="text-ink-muted">Group</span>
                <p className="mt-0.5 font-mono text-xs">{allocation.group}</p>
              </div>
              <div>
                <span className="text-ink-muted">Job</span>
                <p className="mt-0.5 font-mono text-xs">{allocation.job}</p>
              </div>
              <div>
                <span className="text-ink-muted">Node</span>
                <p className="mt-0.5 font-mono text-xs">{allocation.node_id}</p>
              </div>
              <div>
                <span className="text-ink-muted">Revision</span>
                <p className="mt-0.5">{allocation.job_revision}</p>
              </div>
              <div>
                <span className="text-ink-muted">Attempt</span>
                <p className="mt-0.5">{allocation.attempt}</p>
              </div>
              <div>
                <span className="text-ink-muted">Created</span>
                <p className="mt-0.5 text-xs">{new Date(allocation.created_at).toLocaleString()}</p>
              </div>
              {allocation.draining && (
                <div>
                  <Badge variant="warning">Draining</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Logs</h3>
        <div className="space-y-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Badge variant="secondary">stdout</Badge>
            </div>
            <pre className="max-h-96 overflow-auto rounded-md bg-sunken p-4 font-mono text-xs leading-relaxed">
              {stdout || 'No output'}
            </pre>
          </div>
          {stderr && (
            <div>
              <div className="mb-1 flex items-center gap-2">
                <Badge variant="danger">stderr</Badge>
              </div>
              <pre className="max-h-96 overflow-auto rounded-md bg-danger-50 p-4 font-mono text-xs leading-relaxed text-danger-500">
                {stderr}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
