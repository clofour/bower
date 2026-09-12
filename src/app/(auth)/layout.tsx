import { Brand } from '@/components/brand'
import { GrowingTrellis } from '@/components/growing-trellis'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-background">
      <GrowingTrellis className="absolute inset-x-0 bottom-0 h-[62%] w-full" />

      <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-12">
        <div className="grid w-full max-w-5xl items-center gap-12 lg:grid-cols-[1fr_380px] lg:gap-20">
          {/* Left — branding */}
          <div className="max-w-md">
            <Brand size="default" />
            <h1 className="mt-10 text-[40px] font-bold leading-[1.05] tracking-tightest">
              Welcome <span className="italic text-primary">back</span>.
            </h1>
            <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground">
              Projects, environments, and deployments for your Trellis cluster.
              Scheduling stays with Trellis — Bower owns the platform layer above it.
            </p>
          </div>

          {/* Right — form card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-raised">
            {children}
          </div>
        </div>
      </div>

      <footer className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-6 pb-6 text-xs text-muted-foreground">
        <span>Bower &middot; deployment platform for Trellis</span>
      </footer>
    </div>
  )
}
