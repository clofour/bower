import { redirect } from 'next/navigation'
import { Plus, ShieldCheck, Users } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { getProjectsByOrg, getTeamMembers, getTeamProjectAccessList, getTeamsByOrg, getUserOrganization } from '@/lib/queries'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { addTeamMemberAction, createTeamAction, grantTeamProjectAction } from '@/lib/actions/operations'
import { PageHeading } from '@/components/page-heading'

export default async function TeamsPage() {
  const user = await getCurrentUser(); if (!user) redirect('/login')
  const ctx = await getUserOrganization(user.id); if (!ctx) redirect('/login')
  const [teams, projects] = await Promise.all([getTeamsByOrg(ctx.org.id), getProjectsByOrg(ctx.org.id)])
  const detailed = await Promise.all(teams.map(async (team) => ({ team, members: await getTeamMembers(team.id), access: await getTeamProjectAccessList(team.id) })))
  return <div className="mx-auto max-w-5xl"><PageHeading eyebrow="Access" title="Teams" description="Group people and assign a role independently for each project." actions={<details className="relative"><summary className="list-none"><Button asChild><span><Plus className="mr-2 h-4 w-4" />New team</span></Button></summary><Card className="absolute right-0 z-20 mt-2 w-80 p-5 shadow-xl"><form action={createTeamAction} className="space-y-3"><Input name="name" placeholder="Platform engineering" required /><Button className="w-full">Create team</Button></form></Card></details>} />
    {detailed.length === 0 ? <Card className="grid place-items-center py-20 text-center"><div><Users className="mx-auto h-6 w-6 text-primary" /><h2 className="mt-4 font-bold">No teams yet</h2><p className="mt-1 text-sm text-muted-foreground">Create a team to delegate access safely.</p></div></Card> : <div className="grid gap-5">{detailed.map(({ team, members, access }) => <Card key={team.id} className="p-6"><div className="flex items-center justify-between"><div><h2 className="text-lg font-bold">{team.name}</h2><p className="text-xs text-muted-foreground">{members.length} member{members.length === 1 ? '' : 's'} · {access.length} project grant{access.length === 1 ? '' : 's'}</p></div><ShieldCheck className="h-5 w-5 text-primary" /></div><div className="mt-5 grid gap-5 md:grid-cols-2"><div><p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Members</p>{members.map((m) => <div key={m.membership.id} className="py-1 text-sm"><b>{m.userName}</b> <span className="text-muted-foreground">{m.userEmail}</span></div>)}<form action={addTeamMemberAction.bind(null, team.id)} className="mt-3 flex gap-2"><Input name="email" type="email" placeholder="member@example.com" /><Button variant="secondary">Add</Button></form></div><div><p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Project roles</p>{access.map((a) => <div key={a.access.id} className="flex justify-between py-1 text-sm"><span>{a.projectName}</span><b className="capitalize">{a.access.role}</b></div>)}<form action={grantTeamProjectAction.bind(null, team.id)} className="mt-3 grid grid-cols-[1fr_auto_auto] gap-2"><select name="projectId" className="h-9 rounded-md border bg-background px-2 text-sm">{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select><select name="role" className="h-9 rounded-md border bg-background px-2 text-sm"><option value="viewer">Viewer</option><option value="deployer">Deployer</option><option value="admin">Admin</option></select><Button variant="secondary">Grant</Button></form></div></div></Card>)}</div>}
  </div>
}
