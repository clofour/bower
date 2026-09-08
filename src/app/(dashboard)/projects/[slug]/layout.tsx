import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireContext } from '@/lib/actions/shared'
import { getProjectBySlug } from '@/lib/queries'
export default async function ProjectLayout({children,params}:{children:React.ReactNode;params:Promise<{slug:string}>}){const {slug}=await params;const c=await requireContext();const p=await getProjectBySlug(c.org.id,slug);if(!p)notFound();const tabs=[['Overview',''],['Deployments','deployments'],['Environments','environments'],['Routes','routes'],['Secrets','secrets'],['Integrations','integrations'],['Settings','settings']];return <><div className="crumbs"><Link href="/projects">Projects</Link><span>/</span><span>{p.name}</span></div><div className="project-nav">{tabs.map(([n,s])=><Link key={n} href={`/projects/${slug}${s?`/${s}`:''}`}>{n}</Link>)}</div>{children}</>}
