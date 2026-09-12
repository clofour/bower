import { Brand } from '@/components/brand'
import { GrowingTrellis } from '@/components/growing-trellis'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-canvas lg:grid lg:grid-cols-[57fr_43fr]">
      {/* Left — dark panel with vine trellis */}
      <section
        className="relative flex h-56 flex-col justify-between overflow-hidden px-6 py-6 sm:h-64 sm:px-10 sm:py-8 lg:h-auto lg:min-h-screen lg:px-12 lg:py-10"
        style={
          {
            backgroundColor: '#0b1915',
            '--ink': 'hsl(167 33% 95%)',
            '--ink-muted': 'hsl(170 20% 60%)',
            '--brand-500': 'hsl(172 52% 36%)',
          } as React.CSSProperties
        }
      >
        <GrowingTrellis className="absolute inset-0 h-full w-full" />
        <div className="relative">
          <Brand size="default" />
        </div>
        <p className="relative hidden text-xs text-ink-muted lg:block">
          bower &middot; deployment platform for Trellis
        </p>
      </section>

      {/* Right — auth form */}
      <section className="flex items-center justify-center px-6 py-14 sm:px-10 lg:min-h-screen lg:px-12 lg:py-10 xl:px-16">
        <div className="w-full max-w-[368px]">
          <div className="rounded-2xl border border-line bg-surface p-6 shadow-raised">
            {children}
          </div>
        </div>
      </section>
    </div>
  )
}
