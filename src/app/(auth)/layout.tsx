export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen">
      {/* Left branding panel -- hidden on mobile */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[hsl(215,28%,12%)] p-12 text-white lg:flex">
        {/* Decorative grid */}
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.04]"
        >
          <defs>
            <pattern
              id="auth-grid"
              x="0"
              y="0"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1" cy="1" r="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#auth-grid)" />
        </svg>

        {/* Decorative accent shapes */}
        <svg
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -right-24 h-[480px] w-[480px] opacity-10"
          viewBox="0 0 480 480"
        >
          <circle
            cx="240"
            cy="240"
            r="200"
            fill="none"
            stroke="hsl(174,62%,42%)"
            strokeWidth="1.5"
          />
          <circle
            cx="240"
            cy="240"
            r="140"
            fill="none"
            stroke="hsl(174,62%,42%)"
            strokeWidth="1"
          />
          <circle
            cx="240"
            cy="240"
            r="80"
            fill="none"
            stroke="hsl(174,62%,42%)"
            strokeWidth="0.75"
          />
        </svg>

        <svg
          aria-hidden
          className="pointer-events-none absolute -top-16 -left-16 h-[320px] w-[320px] opacity-[0.07]"
          viewBox="0 0 320 320"
        >
          <rect
            x="40"
            y="40"
            width="240"
            height="240"
            rx="8"
            fill="none"
            stroke="hsl(174,62%,42%)"
            strokeWidth="1"
          />
          <rect
            x="80"
            y="80"
            width="160"
            height="160"
            rx="6"
            fill="none"
            stroke="hsl(174,62%,42%)"
            strokeWidth="0.75"
          />
        </svg>

        {/* Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(174,62%,42%)]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5 text-white"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3l-1.912 5.813a2 2 0 01-1.275 1.275L3 12l5.813 1.912a2 2 0 011.275 1.275L12 21l1.912-5.813a2 2 0 011.275-1.275L21 12l-5.813-1.912a2 2 0 01-1.275-1.275L12 3z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">Canopy</span>
          </div>
        </div>

        {/* Tagline */}
        <div className="relative z-10 max-w-sm">
          <h1 className="text-3xl font-bold leading-tight tracking-tight">
            Deploy with
            <br />
            confidence.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/50">
            Ship faster with zero-downtime deployments, instant rollbacks, and
            real-time observability across every cluster.
          </p>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-xs text-white/30">
          &copy; {new Date().getFullYear()} Canopy
        </p>
      </div>

      {/* Right form area */}
      <div className="flex w-full flex-1 flex-col items-center justify-center bg-background px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
