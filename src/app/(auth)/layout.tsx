import { ConstellationBg } from '@/components/constellation-bg'
import { Brand } from '@/components/brand'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-sidebar p-12 lg:flex">
        <ConstellationBg />
        <div className="relative z-10">
          <Brand size="lg" className="text-white" />
        </div>
        <div className="relative z-10 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Deploy with<br />
            <span className="text-primary">confidence.</span>
          </h1>
          <p className="max-w-sm text-sm text-sidebar-foreground">
            Manage your infrastructure, services, and deployments from a single control plane.
          </p>
        </div>
        <div className="relative z-10 text-xs text-sidebar-muted">
          &copy; {new Date().getFullYear()} Bower
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}
