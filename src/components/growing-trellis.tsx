'use client'

import { useCallback, useId, useSyncExternalStore } from 'react'
import { cn } from '@/lib/utils'

const W = 800
const H = 1000
const LATTICE_PITCH = 70
const SAMPLE_STEP = 26
const GROWTH_RATE = 0.006
const LATTICE_DUR = 2.1

type Pt = [number, number]

function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rng = mulberry32(0x76696e65)
function between(lo: number, hi: number) {
  return lo + rng() * (hi - lo)
}

function unit(a: Pt, b: Pt): Pt {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const l = Math.hypot(dx, dy) || 1
  return [dx / l, dy / l]
}

function deg(v: Pt) {
  return (Math.atan2(v[1], v[0]) * 180) / Math.PI
}

function catmullRom(pts: Pt[]): string {
  if (pts.length < 2) return ''
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return d
}

interface Leaf {
  x: number; y: number; angle: number; progress: number
  size: number; flutter: number; flutterDur: number
}

interface Vine {
  id: string; d: string; len: number; width: number
  delay: number; dur: number; root: Pt; tip: Pt
  tipAngle: number; tipFlip: boolean
  sway: number; swayDur: number; leaves: Leaf[]
}

interface Corridor {
  cx: number; height: number; amp: number
  cycles: number; phase: number; drift: number
}

const CORRIDORS: Corridor[] = [
  { cx: 120, height: 0.88, amp: 26, cycles: 3.4, phase: 0.2, drift: 22 },
  { cx: 310, height: 0.64, amp: 20, cycles: 2.4, phase: 1.9, drift: -18 },
  { cx: 500, height: 0.80, amp: 24, cycles: 3.0, phase: 0.9, drift: 20 },
  { cx: 690, height: 0.52, amp: 18, cycles: 2.0, phase: 2.6, drift: -16 },
]

function buildVine(c: Corridor, delay: number, idx: number): Vine {
  const climb = H * c.height
  const n = Math.max(4, Math.round(climb / SAMPLE_STEP))
  const pts: Pt[] = []
  let wobble = 0

  for (let i = 0; i <= n; i++) {
    const t = i / n
    wobble += between(-1.6, 1.6)
    wobble = Math.max(-6, Math.min(6, wobble))
    pts.push([
      c.cx +
        Math.sin(c.phase + t * c.cycles * Math.PI * 2) * c.amp * (0.55 + t * 0.45) +
        c.drift * t +
        wobble,
      H - climb * t,
    ])
  }

  const leaves: Leaf[] = []
  let next = 2
  for (let i = 1; i < pts.length - 1; i++) {
    if (i !== next) continue
    next = i + (rng() > 0.5 ? 3 : 4)
    const tan = unit(pts[i - 1], pts[i + 1])
    const side = rng() > 0.5 ? 1 : -1
    leaves.push({
      x: pts[i][0], y: pts[i][1],
      angle: deg(tan) + side * between(58, 80),
      progress: i / n,
      size: between(0.62, 1),
      flutter: between(3.5, 7),
      flutterDur: between(3.4, 6.2),
    })
  }

  let len = 0
  for (let i = 1; i < pts.length; i++)
    len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])

  const tip = pts[pts.length - 1]
  const tipTan = unit(pts[pts.length - 2], tip)

  return {
    id: `v${idx}`, d: catmullRom(pts), len: len * 1.04,
    width: between(2.1, 2.7), delay, dur: climb * GROWTH_RATE,
    root: pts[0], tip, tipAngle: deg(tipTan), tipFlip: tipTan[0] > 0,
    sway: idx % 2 === 0 ? between(0.9, 1.5) : -between(0.9, 1.5),
    swayDur: between(9, 14), leaves,
  }
}

const VINES: Vine[] = (() => {
  let t = LATTICE_DUR
  return CORRIDORS.map((c, i) => {
    const v = buildVine(c, t, i)
    t = v.delay + v.dur + between(0.4, 1.1)
    return v
  })
})()

const RAIL_N = Math.ceil((W + H) / LATTICE_PITCH)
const DR = Array.from({ length: RAIL_N }, (_, i) => (i - Math.ceil(H / LATTICE_PITCH)) * LATTICE_PITCH)
const UR = Array.from({ length: RAIL_N }, (_, i) => i * LATTICE_PITCH)

const EASE = 'cubic-bezier(0.22,1,0.36,1)'
const VINE_STROKE = 'hsl(172 33% 57%)'
const LEAF_FILL = 'hsl(170 33% 74%)'

const KF = `
@keyframes gt-rail{to{stroke-dashoffset:0}}
@keyframes gt-grow{to{stroke-dashoffset:0}}
@keyframes gt-unfurl{from{opacity:0;transform:scale(.3)}to{opacity:1;transform:scale(1)}}
@keyframes gt-tendril{from{stroke-dashoffset:1;opacity:0}to{stroke-dashoffset:0;opacity:1}}
@keyframes gt-sway{0%,100%{transform:rotate(0)}25%{transform:rotate(var(--sw))}50%{transform:rotate(0)}75%{transform:rotate(calc(var(--sw) * -0.7))}}
@keyframes gt-flutter{0%,100%{transform:rotate(0)}25%{transform:rotate(var(--fl))}50%{transform:rotate(0)}75%{transform:rotate(calc(var(--fl) * -0.8))}}
`

export function GrowingTrellis({ className }: { className?: string }) {
  const id = useId()

  const subRM = useCallback((cb: () => void) => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    mq.addEventListener('change', cb)
    return () => mq.removeEventListener('change', cb)
  }, [])
  const snapRM = useCallback(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )
  const serverRM = useCallback(() => false, [])
  const off = useSyncExternalStore(subRM, snapRM, serverRM)

  function anim(name: string, dur: string, delay: number, ease: string, fill = 'forwards') {
    return off ? undefined : `${name} ${dur} ${ease} ${delay}s ${fill}`
  }

  return (
    <div className={cn('pointer-events-none select-none', className)} aria-hidden="true">
      {!off && <style>{KF}</style>}
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" className="h-full w-full">
        <g stroke={LEAF_FILL} strokeOpacity="0.14" strokeWidth="1">
          {DR.map((c, i) => (
            <line
              key={`${id}d${i}`}
              x1={c} y1={0} x2={c + H} y2={H}
              pathLength={1}
              style={{
                strokeDasharray: 1,
                strokeDashoffset: off ? 0 : 1,
                animation: anim('gt-rail', '1.1s', i * 0.025, EASE),
              }}
            />
          ))}
          {UR.map((c, i) => (
            <line
              key={`${id}u${i}`}
              x1={c} y1={0} x2={c - H} y2={H}
              pathLength={1}
              style={{
                strokeDasharray: 1,
                strokeDashoffset: off ? 0 : 1,
                animation: anim('gt-rail', '1.1s', 0.15 + i * 0.025, EASE),
              }}
            />
          ))}
        </g>

        {VINES.map((v) => (
          <g
            key={v.id}
            style={{
              transformOrigin: `${v.root[0]}px ${v.root[1]}px`,
              transformBox: 'view-box' as const,
              '--sw': `${v.sway}deg`,
              animation: anim('gt-sway', `${v.swayDur}s`, v.delay + v.dur, 'ease-in-out', 'none'),
              animationIterationCount: off ? undefined : 'infinite',
            } as React.CSSProperties}
          >
            <path
              d={v.d}
              fill="none"
              stroke={VINE_STROKE}
              strokeWidth={v.width}
              strokeLinecap="round"
              style={{
                strokeDasharray: v.len,
                strokeDashoffset: off ? 0 : v.len,
                animation: anim('gt-grow', `${v.dur}s`, v.delay, 'linear'),
              }}
            />

            {v.leaves.map((lf, li) => {
              const at = v.delay + v.dur * lf.progress + 0.1
              return (
                <g
                  key={`${v.id}l${li}`}
                  style={{
                    transformOrigin: `${lf.x}px ${lf.y}px`,
                    transformBox: 'view-box' as const,
                    opacity: off ? 1 : 0,
                    animation: anim('gt-unfurl', '0.5s', at, EASE),
                  }}
                >
                  <g
                    style={{
                      transformOrigin: `${lf.x}px ${lf.y}px`,
                      transformBox: 'view-box' as const,
                      '--fl': `${lf.flutter}deg`,
                      animation: anim('gt-flutter', `${lf.flutterDur}s`, at + 0.5, 'ease-in-out', 'none'),
                      animationIterationCount: off ? undefined : 'infinite',
                    } as React.CSSProperties}
                  >
                    <g transform={`translate(${lf.x} ${lf.y}) rotate(${lf.angle}) scale(${lf.size})`}>
                      <path d="M-2 0 L 8 0" stroke={VINE_STROKE} strokeWidth={2.1 / lf.size} strokeLinecap="round" fill="none" />
                      <path d="M8 0 C 14.5 -8 26 -9 32.5 -1 C 26 8 14.5 7 8 0 Z" fill={LEAF_FILL} fillOpacity="0.9" />
                      <path d="M11 0 C 18 -1.4 25 -1.8 30.5 -1.4" stroke={VINE_STROKE} strokeOpacity="0.6" strokeWidth={1 / lf.size} fill="none" />
                    </g>
                  </g>
                </g>
              )
            })}

            <g transform={`translate(${v.tip[0]} ${v.tip[1]}) rotate(${v.tipAngle}) scale(1 ${v.tipFlip ? -1 : 1})`}>
              <path
                d="M0 0 C 7.5 -0.5 12.5 -4 14 -8.5 C 15.5 -13.5 11.5 -16.5 7.5 -15 C 4 -13.8 3.5 -10 6.5 -8.8"
                fill="none"
                stroke={VINE_STROKE}
                strokeWidth={v.width}
                strokeLinecap="round"
                pathLength={1}
                style={{
                  strokeDasharray: 1,
                  strokeDashoffset: off ? 0 : 1,
                  opacity: off ? 1 : 0,
                  animation: anim('gt-tendril', '1.2s', v.delay + v.dur, 'linear'),
                }}
              />
            </g>
          </g>
        ))}
      </svg>
    </div>
  )
}
