import { Trash2 } from 'lucide-react'
import { notFound } from 'next/navigation'
import { PageHeader, Panel, formatDate } from '@/components/primitives'
import { getCurrentUser } from '@/lib/auth'
import { deleteProjectAction, updateProjectAction } from '@/lib/actions/projects'
import { requireProject } from '@/lib/actions/shared'
import {
  getEnvironmentsByProject,
  getProjectBySlug,
  getServicesByProject,
  getTeamsByOrg,
  getUserOrganization,
} from '@/lib/queries'

async function updateProject(projectId: string, formData: FormData) {
  'use server'
  await updateProjectAction(projectId, formData)
}

async function deleteProject(projectId: string) {
  'use server'
  await deleteProjectAction(projectId)
}

export default async function ProjectSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const user = await getCurrentUser()
  if (!user) notFound()
  const context = await getUserOrganization(user.id)
  if (!context) notFound()
  const project = await getProjectBySlug(context.org.id, slug)
  if (!project) notFound()
  const access = await requireProject(project.id)
  const canEdit = access.projectRole === 'admin'
  const [teams, services, environments] = await Promise.all([
    getTeamsByOrg(context.org.id),
    getServicesByProject(project.id),
    getEnvironmentsByProject(project.id),
  ])

  return (
    <>
      <PageHeader
        eyebrow="Project administration"
        title="Settings"
        description="Project identity, ownership, and registry metadata. Runtime configuration stays with each service and environment."
      />

      <div className="grid grid-2">
        <Panel title="Project details" subtitle={'Created ' + formatDate(project.createdAt)}>
          {canEdit ? (
            <form action={updateProject.bind(null, project.id)} className="form-grid">
              <div className="field">
                <label>Name</label>
                <input className="input" name="name" defaultValue={project.name} required />
              </div>
              <div className="field">
                <label>Owning team</label>
                <select className="select" name="owningTeamId" defaultValue={project.owningTeamId || ''}>
                  <option value="">No owning team</option>
                  {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                </select>
              </div>
              <div className="field form-span">
                <label>Description</label>
                <textarea className="textarea" name="description" defaultValue={project.description || ''} />
              </div>
              <div className="field form-span">
                <label>Registry URL</label>
                <input className="input mono" name="registryUrl" defaultValue={project.registryUrl || ''} placeholder="ghcr.io/acme" />
              </div>
              <div className="form-actions">
                <button className="button button-primary" type="submit">Save project</button>
              </div>
            </form>
          ) : (
            <div>
              <div className="key-value"><div className="key-label">Name</div><div>{project.name}</div></div>
              <div className="key-value"><div className="key-label">Slug</div><div className="mono">{project.slug}</div></div>
              <div className="key-value"><div className="key-label">Registry</div><div className="mono">{project.registryUrl || '—'}</div></div>
            </div>
          )}
        </Panel>

        <Panel title="Responsibility boundary" subtitle="What changing this project does—and does not—change.">
          <div className="stack small">
            <div className="callout">Bower owns project metadata, environments, service configuration, deployment history, routing, and access.</div>
            <div className="callout">Trellis remains authoritative for scheduling, placement, allocation lifecycle, health, namespace networking, and secret delivery.</div>
          </div>
        </Panel>
      </div>

      {canEdit ? (
        <div style={{ marginTop: 16 }}>
          <Panel title="Delete project" subtitle="Deletion is intentionally ordered to avoid orphaned workloads." className="danger-zone">
            {services.length || environments.length ? (
              <div className="row-between">
                <div className="muted small">Delete all {services.length} service{services.length === 1 ? '' : 's'} and {environments.length} environment{environments.length === 1 ? '' : 's'} first.</div>
                <button className="button button-danger" type="button" disabled><Trash2 size={13} />Delete project</button>
              </div>
            ) : (
              <form action={deleteProject.bind(null, project.id)} className="row-between">
                <div className="muted small">This permanently removes the project metadata and audit-linked resources.</div>
                <button className="button button-danger" type="submit"><Trash2 size={13} />Delete project</button>
              </form>
            )}
          </Panel>
        </div>
      ) : null}
    </>
  )
}
