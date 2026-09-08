import { Brand } from '@/components/brand'
import { TopologyVisual } from '@/components/topology-visual'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[minmax(28rem,1.05fr)_minmax(26rem,.95fr)]">
      <section className="relative hidden overflow-hidden border-r border-sidebar-border bg-sidebar p-10 lg:flex lg:flex-col xl:p-14" aria-label="About Bower">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_center,var(--nav-muted)_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="relative z-10">
          <Brand size="lg" className="text-white" />
        </div>
        <div className="relative z-10 my-auto space-y-10">
          <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Trellis operations</p>
          <h1 className="max-w-lg text-4xl font-semibold leading-[1.1] tracking-[-.035em] text-white xl:text-5xl">
            Infrastructure,<br /><span className="text-sidebar-foreground">without the noise.</span>
          </h1>
          <p className="max-w-md text-sm leading-6 text-sidebar-muted">
            Plan, deploy, and recover services from a control plane designed for deliberate operations.
          </p>
          </div>
          <TopologyVisual />
        </div>
        <div className="relative z-10 text-xs text-sidebar-muted">
          &copy; {new Date().getFullYear()} Bower
        </div>
      </section>
      <section className="flex min-h-dvh items-center justify-center px-5 py-12 sm:px-10" aria-label="Account access">
        <div className="w-full max-w-[25rem]"><div className="mb-10 lg:hidden"><Brand /></div>{children}</div>
      </section>
    </main>
  )
}
