import Link from 'next/link'
import { Brand } from './brand'
const primary=[['Overview','/dashboard'],['Projects','/projects'],['Cluster','/cluster']]
const manage=[['Organization','/settings/organization'],['Teams & access','/settings/teams'],['Templates','/settings/templates'],['Audit log','/settings/audit'],['Account','/settings/account']]
export function Sidebar({org}:{org:string}){return <aside className="sidebar"><Brand light/><div className="nav-label" style={{padding:'0 12px 8px'}}>Workspace</div><nav className="nav">{primary.map(([n,h])=><Link key={h} href={h}>{n}</Link>)}</nav><div className="nav-label" style={{padding:'28px 12px 8px'}}>Manage</div><nav className="nav">{manage.map(([n,h])=><Link key={h} href={h}>{n}</Link>)}</nav><div className="sidebar-foot"><div style={{fontWeight:600}}>{org}</div><div style={{color:'#829087',fontSize:12,marginTop:4}}>Connected to Trellis</div></div></aside>}
