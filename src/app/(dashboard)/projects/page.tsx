import Link from 'next/link'
import { requireContext } from '@/lib/actions/shared'
import { getProjectsForUser } from '@/lib/queries'
import { PageHeading } from '@/components/page-heading'
import { CreateProject } from '@/components/create-project'
export default async function Projects(){const c=await requireContext();const projects=await getProjectsForUser(c.org.id,c.user.id,c.role);return <><PageHeading eyebrow="Projects" title={`${projects.length} ${projects.length===1?'project':'projects'}`} description="Organize related services, environments, traffic, and credentials."/><div className="grid grid-2"><section><div className="stack">{projects.map(p=><Link className="list-card" href={`/projects/${p.slug}`} key={p.id}><div><h3>{p.name}</h3><p>{p.description||'No description added'}</p></div><span className="pill">Open →</span></Link>)}{!projects.length&&<div className="empty"><strong>No projects yet</strong>Create the first project to begin organizing services.</div>}</div></section>{c.role!=='member'&&<CreateProject/>}</div></>}
