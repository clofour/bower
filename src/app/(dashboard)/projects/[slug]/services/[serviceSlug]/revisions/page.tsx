import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHeader, Panel, formatDate } from '@/components/primitives'
import { getCurrentUser } from '@/lib/auth'
import { requireService } from '@/lib/actions/shared'
import { getProjectBySlug, getServiceBySlug, getServiceConfigsWithEnvironments, getUserOrganization } from '@/lib/queries'
import { getTrellisClient } from '@/lib/trellis-instance'

export default async function RevisionsPage({ params }: { params: Promise<{ slug: string; serviceSlug: string }> }) {
  const { slug, serviceSlug } = await params
  const user = await getCurrentUser()
  if (!user) notFound()
  const context = await getUserOrganization(user.id)
  if (!context) notFound()
  const project = await getProjectBySlug(context.org.id, slug)
  if (!project) notFound()
  const service = await getServiceBySlug(project.id, serviceSlug)
  if (!service) notFound()
  await requireService(service.id)
  const configs = await getServiceConfigsWithEnvironments(service.id)
  const client = await getTrellisClient(context.org.id).catch(() => null)
  return <>
    <PageHeader eyebrow="Trellis history" title="Job revisions" description="Stored job versions for each environment." actions={<Link className="button button-secondary" href={'/projects/' + slug + '/services/' + service.slug}>Back to service</Link>} />
    <div className="stack">
      {configs.map(async ({ config, environment }) => {
        const items = client ? await client.getJobRevisions(config.activeJobName || service.slug, environment.trellisNamespace).catch(() => []) : []
        return <Panel key={environment.id} title={environment.name} subtitle={environment.trellisNamespace}>
          {items.length ? items.map((item) => <details className="disclosure" key={item.revision}><summary><span>Revision {item.revision}</span><span className="small muted">{formatDate(item.created_at)}</span></summary><div className="disclosure-body"><pre className="code-panel">{JSON.stringify(item.spec, null, 2)}</pre></div></details>) : <div className="empty"><div className="empty-title">No revision history available</div><div>This service has no stored revisions in this environment.</div></div>}
        </Panel>
      })}
    </div>
  </>
}
