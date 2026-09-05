import { Brand } from "@/components/brand";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 py-12">
      {/* Animated network constellation */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full text-primary"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMax slice"
        fill="none"
      >
        {/* Cluster 1 — lower left, slow drift */}
        <g className="auth-drift-1">
          <circle cx="120" cy="680" r="2" fill="currentColor" opacity="0.07" />
          <circle cx="220" cy="740" r="1.5" fill="currentColor" opacity="0.06" />
          <circle cx="340" cy="690" r="2" fill="currentColor" opacity="0.07" />
          <circle cx="280" cy="620" r="1.5" fill="currentColor" opacity="0.05" />
          <circle cx="160" cy="590" r="2" fill="currentColor" opacity="0.06" />
          <line x1="120" y1="680" x2="220" y2="740" stroke="currentColor" strokeWidth="0.75" opacity="0.05" className="auth-flow-med" />
          <line x1="220" y1="740" x2="340" y2="690" stroke="currentColor" strokeWidth="0.75" opacity="0.04" className="auth-flow-slow" />
          <line x1="340" y1="690" x2="280" y2="620" stroke="currentColor" strokeWidth="0.75" opacity="0.05" className="auth-flow-fast" />
          <line x1="280" y1="620" x2="160" y2="590" stroke="currentColor" strokeWidth="0.75" opacity="0.04" className="auth-flow-med" />
          <line x1="160" y1="590" x2="120" y2="680" stroke="currentColor" strokeWidth="0.75" opacity="0.03" className="auth-flow-slow" />
        </g>

        {/* Cluster 2 — center bottom, medium drift */}
        <g className="auth-drift-2">
          <circle cx="580" cy="720" r="2" fill="currentColor" opacity="0.06" />
          <circle cx="680" cy="660" r="1.5" fill="currentColor" opacity="0.07" />
          <circle cx="760" cy="730" r="2" fill="currentColor" opacity="0.05" />
          <circle cx="850" cy="680" r="1.5" fill="currentColor" opacity="0.06" />
          <circle cx="720" cy="600" r="2" fill="currentColor" opacity="0.06" />
          <line x1="580" y1="720" x2="680" y2="660" stroke="currentColor" strokeWidth="0.75" opacity="0.04" className="auth-flow-fast" />
          <line x1="680" y1="660" x2="760" y2="730" stroke="currentColor" strokeWidth="0.75" opacity="0.05" className="auth-flow-med" />
          <line x1="760" y1="730" x2="850" y2="680" stroke="currentColor" strokeWidth="0.75" opacity="0.04" className="auth-flow-slow" />
          <line x1="680" y1="660" x2="720" y2="600" stroke="currentColor" strokeWidth="0.75" opacity="0.03" className="auth-flow-fast" />
        </g>

        {/* Cluster 3 — lower right, upward drift */}
        <g className="auth-drift-3">
          <circle cx="1020" cy="700" r="1.5" fill="currentColor" opacity="0.06" />
          <circle cx="1120" cy="650" r="2" fill="currentColor" opacity="0.07" />
          <circle cx="1200" cy="720" r="1.5" fill="currentColor" opacity="0.05" />
          <circle cx="1300" cy="670" r="2" fill="currentColor" opacity="0.06" />
          <circle cx="1100" cy="580" r="1.5" fill="currentColor" opacity="0.05" />
          <line x1="1020" y1="700" x2="1120" y2="650" stroke="currentColor" strokeWidth="0.75" opacity="0.04" className="auth-flow-med" />
          <line x1="1120" y1="650" x2="1200" y2="720" stroke="currentColor" strokeWidth="0.75" opacity="0.05" className="auth-flow-fast" />
          <line x1="1200" y1="720" x2="1300" y2="670" stroke="currentColor" strokeWidth="0.75" opacity="0.04" className="auth-flow-slow" />
          <line x1="1120" y1="650" x2="1100" y2="580" stroke="currentColor" strokeWidth="0.75" opacity="0.03" className="auth-flow-med" />
        </g>

        {/* Cross-cluster connections */}
        <line x1="340" y1="690" x2="580" y2="720" stroke="currentColor" strokeWidth="0.5" opacity="0.03" className="auth-flow-cross" />
        <line x1="850" y1="680" x2="1020" y2="700" stroke="currentColor" strokeWidth="0.5" opacity="0.03" className="auth-flow-cross" />

        {/* Scattered depth nodes */}
        <circle cx="450" cy="540" r="1.5" fill="currentColor" opacity="0.04" />
        <circle cx="900" cy="520" r="1" fill="currentColor" opacity="0.04" />
        <circle cx="600" cy="480" r="1.5" fill="currentColor" opacity="0.03" />
        <circle cx="1050" cy="550" r="1" fill="currentColor" opacity="0.04" />
        <circle cx="200" cy="500" r="1" fill="currentColor" opacity="0.03" />
      </svg>

      {/* Content */}
      <div className="relative z-10 w-full max-w-[380px]">
        <div
          className="auth-stagger mb-10"
          style={{ "--stagger": "0" } as React.CSSProperties}
        >
          <Brand />
        </div>
        {children}
      </div>

      {/* Footer */}
      <p
        className="auth-stagger relative z-10 mt-auto pt-16 text-xs text-muted-foreground/60"
        style={{ "--stagger": "5" } as React.CSSProperties}
      >
        &copy; {new Date().getFullYear()} Bower
      </p>
    </div>
  );
}
