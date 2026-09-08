import Link from 'next/link'
import { ArrowRight, Plus } from 'lucide-react'
import { PageHeader, Metric, Panel, EmptyState, StatusPill, formatDate } from '@/components/primitives'
import { getCurrentUser } from '@/lib/auth'
import {
  getDeploymentsByProject,
  getEnvironmentsByProject,
  getProjectsForUser,
  getServicesByProject,
  getUserOrganization,
} from '@/lib/queries'
import { getTrellisClient } from '@/lib/trellis-instance'
import type { TrellisNode } from '@/types/trellis'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) return null
  const context = await getUserOrganization(user.id)
  if (!context) return null

  const projects = await getProjectsForUser(context.org.id, user.id, context.role)
  const projectRows = await Promise.all(projects.map(async (project) => {
    const [services, environments, deployments] = await Promise.all([
      getServicesByProject(project.id),
      getEnvironmentsByProject(project.id),
      getDeploymentsByProject(project.id, 8),
    ])
    return { project, services, environments, deployments }
  }))

  const recent = projectRows
    .flatMap((row) => row.deployments.map((deployment) => ({ ...deployment, project: row.project })))
    .sort((a, b) => new Date(b.deployment.createdAt).getTime() - new Date(a.deployment.createdAt).getTime())
    .slice(0, 8)

  let nodes: TrellisNode[] = []
  try {
    const client = await getTrellisClient(context.org.id)
    nodes = await client.listNodes()
  } catch {
    nodes = []
  }

  const serviceCount = projectRows.reduce((total, row) => total + row.services.length, 0)
  const healthyNodes = nodes.filter((node) => node.status === 'healthy').length
  const activeDeployments = recent.filter((row) => ['pending', 'planning', 'deploying'].includes(row.deployment.status)).length

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title={'Good to see you, ' + user.name.split(' ')[0] + '.'}
        description="A concise view of what is deployed, what is changing, and where attention is needed."
        actions={<Link className="button button-primary" href="/projects?create=1"><Plus size={14} />New project</Link>}
      />

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <Metric label="Projects" value={projects.length} detail="Accessible to you" />
        <Metric label="Services" value={serviceCount} detail="Across all projects" />
        <Metric label="Healthy nodes" value={nodes.length ? healthyNodes + '/' + nodes.length : '—'} detail={nodes.length ? 'Trellis cluster' : 'Cluster unavailable'} />
        <Metric label="In progress" value={activeDeployments} detail="Recent deployments" />
      </div>

      <div className="grid grid-2">
        <Panel
          title="Projects"
          subtitle="Your application spaces"
          action={<Link className="button button-secondary button-sm" href="/projects">View all <ArrowRight size={13} /></Link>}
        >
          {projectRows.length === 0 ? (
            <EmptyState title="No projects yet" description="Create a project to get staging and production environments automatically." href="/projects?create=1" actionLabel="Create project" />
          ) : (
            <div className="list">
              {projectRows.slice(0, 6).map(({ project, services, environments, deployments }) => (
                <Link className="list-row" href={'/projects/' + project.slug} key={project.id}>
                  <div className="list-main">
                    <div className="list-title">{project.name}</div>
                    <div className="list-meta">{services.length} service{services.length === 1 ? '' : 's'} · {environments.length} environment{environments.length === 1 ? '' : 's'}</div>
                  </div>
                  <div className="list-actions">
                    {deployments[0] ? <StatusPill status={deployments[0].deployment.status} /> : <span className="pill">not deployed</span>}
                    <ArrowRight size={14} className="muted" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Deployment feed" subtitle="Latest changes across projects">
          {recent.length === 0 ? (
            <EmptyState title="No deployment history" description="Deployments will appear here once a service is released." />
          ) : (
            <div className="list">
              {recent.map((row) => (
                <Link className="list-row" href={'/projects/' + row.project.slug + '/deployments'} key={row.deployment.id}>
                  <div className="list-main">
                    <div className="list-title">{row.serviceName} <span className="muted">→</span> {row.environmentName}</div>
                    <div className="list-meta">{row.project.name} · {row.deployment.imageAfter} · {formatDate(row.deployment.createdAt)}</div>
                  </div>
                  <StatusPill status={row.deployment.status} />
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </>
  )
}
