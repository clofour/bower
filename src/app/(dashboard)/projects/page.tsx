import Link from 'next/link'
import { ArrowRight, Plus, X } from 'lucide-react'
import { PageHeader, Panel, EmptyState, formatDate } from '@/components/primitives'
import { getCurrentUser } from '@/lib/auth'
import { createProjectAction } from '@/lib/actions/projects'
import {
  getEnvironmentsByProject,
  getProjectsForUser,
  getServicesByProject,
  getTeamsByOrg,
  getUserOrganization,
} from '@/lib/queries'

async function createProject(formData: FormData) {
  'use server'
  await createProjectAction(formData)
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const user = await getCurrentUser()
  if (!user) return null
  const context = await getUserOrganization(user.id)
  if (!context) return null

  const query = await searchParams
  const showCreate = query.create === '1'
  const [projects, teams] = await Promise.all([
    getProjectsForUser(context.org.id, user.id, context.role),
    getTeamsByOrg(context.org.id),
  ])
  const rows = await Promise.all(projects.map(async (project) => ({
    project,
    services: await getServicesByProject(project.id),
    environments: await getEnvironmentsByProject(project.id),
  })))
  const canCreate = context.role !== 'member'

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Projects"
        description="Projects group services, release environments, routes, secrets, and access around one application."
        actions={canCreate ? (
          showCreate
            ? <Link className="button button-secondary" href="/projects"><X size={14} />Close</Link>
            : <Link className="button button-primary" href="/projects?create=1"><Plus size={14} />New project</Link>
        ) : undefined}
      />

      {showCreate && canCreate ? (
        <Panel title="Create project" subtitle="Staging and production are created automatically." className="" >
          <form action={createProject} className="form-grid">
            <div className="field">
              <label htmlFor="project-name">Name</label>
              <input id="project-name" className="input" name="name" placeholder="Atlas" required autoFocus />
            </div>
            <div className="field">
              <label htmlFor="project-team">Owning team</label>
              <select id="project-team" className="select" name="owningTeamId" defaultValue="">
                <option value="">No owning team</option>
                {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
              </select>
            </div>
            <div className="field form-span">
              <label htmlFor="project-description">Description</label>
              <textarea id="project-description" className="textarea" name="description" placeholder="What this application does and who owns it." />
            </div>
            <div className="field form-span">
              <label htmlFor="registry-url">Container registry</label>
              <input id="registry-url" className="input mono" name="registryUrl" placeholder="ghcr.io/acme" />
              <span className="field-hint">Optional project-level registry hint.</span>
            </div>
            <div className="form-actions">
              <Link className="button button-secondary" href="/projects">Cancel</Link>
              <button className="button button-primary" type="submit">Create project</button>
            </div>
          </form>
        </Panel>
      ) : null}

      <div style={{ height: showCreate && canCreate ? 16 : 0 }} />

      {rows.length === 0 ? (
        <Panel>
          <EmptyState
            title="Nothing deployed yet"
            description={canCreate ? 'Start with a project. Bower will create a simple staging → production promotion path for you.' : 'You do not have project access yet.'}
            href={canCreate ? '/projects?create=1' : undefined}
            actionLabel={canCreate ? 'Create project' : undefined}
          />
        </Panel>
      ) : (
        <div className="grid grid-2">
          {rows.map(({ project, services, environments }) => (
            <Link className="panel service-card" key={project.id} href={'/projects/' + project.slug}>
              <div className="service-card-top">
                <div>
                  <div className="service-name">{project.name}</div>
                  <div className="service-type mono">{project.slug}</div>
                </div>
                <ArrowRight size={16} className="muted" />
              </div>
              <div className="muted small" style={{ minHeight: 34 }}>
                {project.description || 'No project description.'}
              </div>
              <div className="service-env-strip">
                <span className="env-chip">{services.length} service{services.length === 1 ? '' : 's'}</span>
                {environments.map((environment) => <span className="env-chip" key={environment.id}>{environment.name}</span>)}
              </div>
              <div className="row-between small muted">
                <span>{project.registryUrl || 'No registry set'}</span>
                <span>Updated {formatDate(project.updatedAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
