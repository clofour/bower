import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getUserOrganization } from '@/lib/queries'
import { logoutAction } from '@/lib/auth-actions'
import { Sidebar } from '@/components/sidebar'
export default async function DashboardLayout({children}:{children:React.ReactNode}){const user=await getCurrentUser();if(!user)redirect('/login');const ctx=await getUserOrganization(user.id);if(!ctx)redirect('/login');return <div className="shell"><Sidebar org={ctx.org.name}/><div className="content"><header className="topbar"><span style={{color:'var(--muted)',marginRight:18}}>{user.name}</span><form action={logoutAction}><button>Sign out</button></form></header><main>{children}</main></div></div>}
