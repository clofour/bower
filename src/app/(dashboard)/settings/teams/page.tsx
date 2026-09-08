import { Plus, Trash2, UserMinus } from 'lucide-react'
import { PageHeader, Panel, Pill } from '@/components/primitives'
import { requireContext } from '@/lib/actions/shared'
import {
  addTeamMemberAction,
  createTeamAction,
  deleteTeamAction,
  grantTeamProjectAction,
  removeTeamMemberAction,
  revokeTeamProjectAction,
} from '@/lib/actions/operations'
import {
  getProjectsByOrg,
  getTeamMembers,
  getTeamProjectAccessList,
  getTeamsByOrg,
} from '@/lib/queries'

export default async function TeamsPage() {
  const context = await requireContext()
  const canEdit = context.role === 'owner' || context.role === 'admin'
  const [teams, projects] = await Promise.all([
    getTeamsByOrg(context.org.id),
    getProjectsByOrg(context.org.id),
  ])
  const rows = await Promise.all(teams.map(async (team) => ({
    team,
    members: await getTeamMembers(team.id),
    access: await getTeamProjectAccessList(team.id),
  })))

  return (
    <>
      <PageHeader
        eyebrow="Organization"
        title="Teams"
        description="Group organization members, then grant project-scoped admin, deployer, or viewer access."
      />

      <div className="stack">
        {rows.map(({ team, members, access }) => (
          <Panel
            key={team.id}
            title={team.name}
            subtitle={members.length + ' member' + (members.length === 1 ? '' : 's') + ' · ' + access.length + ' project grant' + (access.length === 1 ? '' : 's')}
            action={canEdit ? (
              <form action={deleteTeamAction.bind(null, team.id)}>
                <button className="button button-danger button-sm" type="submit"><Trash2 size={12} />Delete team</button>
              </form>
            ) : undefined}
          >
            <div className="grid grid-2">
              <div>
                <div className="strong small" style={{ marginBottom: 8 }}>Members</div>
                {members.length ? (
                  <div className="list panel">
                    {members.map((member) => (
                      <div className="list-row" key={member.membership.id}>
                        <div>
                          <div className="list-title">{member.userName}</div>
                          <div className="list-meta">{member.userEmail}</div>
                        </div>
                        {canEdit ? (
                          <form action={removeTeamMemberAction.bind(null, team.id, member.membership.id)}>
                            <button className="button button-danger button-sm" type="submit" title="Remove member"><UserMinus size={12} /></button>
                          </form>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : <div className="muted small">No members.</div>}
                {canEdit ? (
                  <form action={addTeamMemberAction.bind(null, team.id)} className="row" style={{ marginTop: 10 }}>
                    <input className="input" name="email" type="email" placeholder="member@example.com" required style={{ flex: 1 }} />
                    <button className="button button-secondary button-sm" type="submit">Add</button>
                  </form>
                ) : null}
              </div>

              <div>
                <div className="strong small" style={{ marginBottom: 8 }}>Project access</div>
                {access.length ? (
                  <div className="list panel">
                    {access.map((row) => (
                      <div className="list-row" key={row.access.id}>
                        <div>
                          <div className="list-title">{row.projectName}</div>
                          <div className="list-meta mono">{row.projectSlug}</div>
                        </div>
                        <div className="list-actions">
                          <Pill tone={row.access.role === 'admin' ? 'accent' : row.access.role === 'deployer' ? 'blue' : 'default'}>{row.access.role}</Pill>
                          {canEdit ? (
                            <form action={revokeTeamProjectAction.bind(null, team.id, row.access.id)}>
                              <button className="button button-danger button-sm" type="submit">Revoke</button>
                            </form>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <div className="muted small">No project grants.</div>}
                {canEdit && projects.length ? (
                  <form action={grantTeamProjectAction.bind(null, team.id)} className="row" style={{ marginTop: 10 }}>
                    <select className="select" name="projectId" required defaultValue="" style={{ flex: 1, minWidth: 150 }}>
                      <option value="" disabled>Choose project</option>
                      {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                    </select>
                    <select className="select" name="role" defaultValue="viewer" style={{ width: 125 }}>
                      <option value="viewer">Viewer</option>
                      <option value="deployer">Deployer</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button className="button button-secondary button-sm" type="submit">Grant</button>
                  </form>
                ) : null}
              </div>
            </div>
          </Panel>
        ))}

        {rows.length === 0 ? (
          <Panel><div className="empty"><div className="empty-title">No teams</div><div>Create a team to scope project access for organization members.</div></div></Panel>
        ) : null}
      </div>

      {canEdit ? (
        <div style={{ marginTop: 16 }}>
          <Panel title={<span className="row"><Plus size={15} />Create team</span>} subtitle="Teams are organization-wide; project roles are granted separately.">
            <form action={createTeamAction} className="row">
              <input className="input" name="name" placeholder="Platform" required style={{ maxWidth: 320 }} />
              <button className="button button-primary" type="submit">Create team</button>
            </form>
          </Panel>
        </div>
      ) : null}
    </>
  )
}
