import { Brand } from "@/components/brand";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 py-12">
      {/* Animated vine network */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMax slice"
        fill="none"
      >
        {/* Vine 1 — grows from bottom-left, curves upward */}
        <path
          className="vine-stem"
          d="M-20 920 C 60 860 100 780 140 700 C 180 620 160 540 200 460 C 240 380 300 340 340 280 C 380 220 360 160 400 100"
          strokeWidth="1.5"
          style={
            {
              "--vine-length": "1200",
              "--vine-duration": "4s",
              "--vine-delay": "0.3s",
              opacity: 0.07,
            } as React.CSSProperties
          }
        />
        {/* Branch from vine 1 */}
        <path
          className="vine-stem"
          d="M140 700 C 180 680 220 690 260 660 C 300 630 320 600 380 580"
          strokeWidth="1"
          style={
            {
              "--vine-length": "400",
              "--vine-duration": "2s",
              "--vine-delay": "2s",
              opacity: 0.05,
            } as React.CSSProperties
          }
        />
        {/* Leaves on vine 1 */}
        <path
          className="vine-leaf"
          d="M200 460 C 210 440 230 435 240 445 C 230 455 210 458 200 460"
          style={
            {
              "--leaf-delay": "2.2s",
              "--leaf-opacity": "0.1",
              "--leaf-angle": "-25",
              "--sway": "5",
              "--sway-offset": "0",
            } as React.CSSProperties
          }
        />
        <path
          className="vine-leaf"
          d="M340 280 C 355 268 370 270 368 285 C 355 282 342 285 340 280"
          style={
            {
              "--leaf-delay": "2.8s",
              "--leaf-opacity": "0.12",
              "--leaf-angle": "15",
              "--sway": "3",
              "--sway-offset": "1",
            } as React.CSSProperties
          }
        />
        <path
          className="vine-leaf"
          d="M260 660 C 268 642 285 640 288 652 C 275 654 265 656 260 660"
          style={
            {
              "--leaf-delay": "3s",
              "--leaf-opacity": "0.08",
              "--leaf-angle": "-10",
              "--sway": "4",
              "--sway-offset": "2",
            } as React.CSSProperties
          }
        />
        {/* Buds on vine 1 */}
        <circle
          className="vine-bud"
          cx="400"
          cy="100"
          r="3"
          style={
            {
              "--bud-delay": "3.8s",
              "--bud-opacity": "0.1",
              "--pulse-offset": "0",
            } as React.CSSProperties
          }
        />
        <circle
          className="vine-bud"
          cx="380"
          cy="580"
          r="2.5"
          style={
            {
              "--bud-delay": "3.5s",
              "--bud-opacity": "0.07",
              "--pulse-offset": "1",
            } as React.CSSProperties
          }
        />

        {/* Vine 2 — grows from bottom-center, meanders upward */}
        <path
          className="vine-stem"
          d="M680 920 C 700 850 660 780 680 720 C 700 660 740 620 720 560 C 700 500 660 460 680 400 C 700 340 740 300 720 240"
          strokeWidth="1.5"
          style={
            {
              "--vine-length": "1000",
              "--vine-duration": "4.5s",
              "--vine-delay": "0.8s",
              opacity: 0.06,
            } as React.CSSProperties
          }
        />
        {/* Branch from vine 2 left */}
        <path
          className="vine-stem"
          d="M680 720 C 640 700 600 710 560 690 C 520 670 500 640 480 620"
          strokeWidth="1"
          style={
            {
              "--vine-length": "350",
              "--vine-duration": "2s",
              "--vine-delay": "2.8s",
              opacity: 0.04,
            } as React.CSSProperties
          }
        />
        {/* Branch from vine 2 right */}
        <path
          className="vine-stem"
          d="M720 560 C 760 540 800 550 840 530 C 880 510 900 480 940 470"
          strokeWidth="1"
          style={
            {
              "--vine-length": "350",
              "--vine-duration": "2s",
              "--vine-delay": "3.2s",
              opacity: 0.04,
            } as React.CSSProperties
          }
        />
        {/* Leaves on vine 2 */}
        <path
          className="vine-leaf"
          d="M680 400 C 695 388 710 392 706 406 C 694 402 682 404 680 400"
          style={
            {
              "--leaf-delay": "3.2s",
              "--leaf-opacity": "0.1",
              "--leaf-angle": "20",
              "--sway": "4",
              "--sway-offset": "1",
            } as React.CSSProperties
          }
        />
        <path
          className="vine-leaf"
          d="M560 690 C 548 676 552 660 566 664 C 564 678 558 688 560 690"
          style={
            {
              "--leaf-delay": "4s",
              "--leaf-opacity": "0.08",
              "--leaf-angle": "-30",
              "--sway": "6",
              "--sway-offset": "0",
            } as React.CSSProperties
          }
        />
        <path
          className="vine-leaf"
          d="M840 530 C 852 516 868 520 864 534 C 852 530 842 532 840 530"
          style={
            {
              "--leaf-delay": "4.5s",
              "--leaf-opacity": "0.09",
              "--leaf-angle": "10",
              "--sway": "3",
              "--sway-offset": "2",
            } as React.CSSProperties
          }
        />
        {/* Buds on vine 2 */}
        <circle
          className="vine-bud"
          cx="720"
          cy="240"
          r="3"
          style={
            {
              "--bud-delay": "4.8s",
              "--bud-opacity": "0.09",
              "--pulse-offset": "2",
            } as React.CSSProperties
          }
        />
        <circle
          className="vine-bud"
          cx="480"
          cy="620"
          r="2.5"
          style={
            {
              "--bud-delay": "4.2s",
              "--bud-opacity": "0.06",
              "--pulse-offset": "1",
            } as React.CSSProperties
          }
        />

        {/* Vine 3 — grows from bottom-right, arching left */}
        <path
          className="vine-stem"
          d="M1460 920 C 1380 860 1340 780 1300 700 C 1260 620 1280 540 1240 460 C 1200 380 1140 340 1120 280 C 1100 220 1120 160 1080 100"
          strokeWidth="1.5"
          style={
            {
              "--vine-length": "1200",
              "--vine-duration": "4s",
              "--vine-delay": "0.5s",
              opacity: 0.07,
            } as React.CSSProperties
          }
        />
        {/* Branch from vine 3 */}
        <path
          className="vine-stem"
          d="M1300 700 C 1260 680 1220 690 1180 670 C 1140 650 1100 620 1060 600"
          strokeWidth="1"
          style={
            {
              "--vine-length": "400",
              "--vine-duration": "2s",
              "--vine-delay": "2.2s",
              opacity: 0.05,
            } as React.CSSProperties
          }
        />
        {/* Leaves on vine 3 */}
        <path
          className="vine-leaf"
          d="M1240 460 C 1228 445 1232 430 1246 434 C 1244 448 1238 456 1240 460"
          style={
            {
              "--leaf-delay": "2.4s",
              "--leaf-opacity": "0.1",
              "--leaf-angle": "25",
              "--sway": "5",
              "--sway-offset": "1",
            } as React.CSSProperties
          }
        />
        <path
          className="vine-leaf"
          d="M1120 280 C 1108 266 1112 252 1126 256 C 1124 268 1118 278 1120 280"
          style={
            {
              "--leaf-delay": "3s",
              "--leaf-opacity": "0.12",
              "--leaf-angle": "-15",
              "--sway": "3",
              "--sway-offset": "0",
            } as React.CSSProperties
          }
        />
        <path
          className="vine-leaf"
          d="M1180 670 C 1168 654 1174 640 1186 646 C 1184 660 1178 666 1180 670"
          style={
            {
              "--leaf-delay": "3.4s",
              "--leaf-opacity": "0.08",
              "--leaf-angle": "10",
              "--sway": "4",
              "--sway-offset": "2",
            } as React.CSSProperties
          }
        />
        {/* Buds on vine 3 */}
        <circle
          className="vine-bud"
          cx="1080"
          cy="100"
          r="3"
          style={
            {
              "--bud-delay": "3.6s",
              "--bud-opacity": "0.1",
              "--pulse-offset": "1",
            } as React.CSSProperties
          }
        />
        <circle
          className="vine-bud"
          cx="1060"
          cy="600"
          r="2.5"
          style={
            {
              "--bud-delay": "3.8s",
              "--bud-opacity": "0.07",
              "--pulse-offset": "0",
            } as React.CSSProperties
          }
        />
        <circle
          className="vine-bud"
          cx="940"
          cy="470"
          r="2"
          style={
            {
              "--bud-delay": "4.6s",
              "--bud-opacity": "0.06",
              "--pulse-offset": "2",
            } as React.CSSProperties
          }
        />

        {/* Thin tendril connectors between vines */}
        <path
          className="vine-stem"
          d="M380 580 C 420 570 460 580 480 620"
          strokeWidth="0.75"
          style={
            {
              "--vine-length": "200",
              "--vine-duration": "1.5s",
              "--vine-delay": "4s",
              opacity: 0.03,
            } as React.CSSProperties
          }
        />
        <path
          className="vine-stem"
          d="M940 470 C 980 460 1020 470 1060 600"
          strokeWidth="0.75"
          style={
            {
              "--vine-length": "250",
              "--vine-duration": "1.5s",
              "--vine-delay": "4.5s",
              opacity: 0.03,
            } as React.CSSProperties
          }
        />
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
