'use client'

import { useEffect, useState, useId, useSyncExternalStore, useCallback } from 'react'
import { cn } from '@/lib/utils'

const VINES = [
  'M 74 520 C 104 424 52 372 132 306 C 210 242 166 190 250 138',
  'M 402 520 C 424 442 362 404 442 336 C 512 276 492 224 578 176',
  'M 786 520 C 816 434 744 396 824 326 C 902 258 874 206 972 148',
]

interface Leaf {
  x: number
  y: number
  rotate: number
  scale: number
  vine: number
}

const LEAVES: Leaf[] = [
  { x: 92, y: 430, rotate: -28, scale: 1, vine: 0 },
  { x: 116, y: 344, rotate: 34, scale: 0.86, vine: 0 },
  { x: 186, y: 258, rotate: -18, scale: 1.05, vine: 0 },
  { x: 246, y: 150, rotate: 22, scale: 0.9, vine: 0 },
  { x: 414, y: 448, rotate: 30, scale: 0.92, vine: 1 },
  { x: 400, y: 372, rotate: -34, scale: 1.04, vine: 1 },
  { x: 476, y: 300, rotate: 18, scale: 0.88, vine: 1 },
  { x: 566, y: 190, rotate: -22, scale: 1, vine: 1 },
  { x: 806, y: 442, rotate: -30, scale: 0.94, vine: 2 },
  { x: 792, y: 366, rotate: 28, scale: 1.06, vine: 2 },
  { x: 872, y: 286, rotate: -16, scale: 0.9, vine: 2 },
  { x: 962, y: 160, rotate: 24, scale: 1, vine: 2 },
  { x: 300, y: 468, rotate: 8, scale: 0.8, vine: 0 },
  { x: 690, y: 452, rotate: -8, scale: 0.8, vine: 1 },
  { x: 1080, y: 452, rotate: 12, scale: 0.8, vine: 2 },
]

function Glyph({ index }: { index: number }) {
  switch (index % 4) {
    case 0:
      return (
        <path
          d="M0 0 C 5 -2 10 -7 8 -14 C 1 -12 -1 -6 0 0 Z"
          fill="currentColor"
          fillOpacity="0.9"
        />
      )
    case 1:
      return (
        <g fill="currentColor" fillOpacity="0.85">
          <circle cx="0" cy="-4" r="2.6" />
          <circle cx="4" cy="0" r="2.6" />
          <circle cx="0" cy="4" r="2.6" />
          <circle cx="-4" cy="0" r="2.6" />
        </g>
      )
    case 2:
      return (
        <rect
          x="-3.6"
          y="-3.6"
          width="7.2"
          height="7.2"
          rx="1.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      )
    default:
      return (
        <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M0 -4.5V4.5" />
          <path d="M-4.5 0H4.5" />
        </g>
      )
  }
}

export function GrowingTrellis({ className }: { className?: string }) {
  const id = useId()
  const [phase, setPhase] = useState(0)

  const reducedSubscribe = useCallback((cb: () => void) => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    mq.addEventListener('change', cb)
    return () => mq.removeEventListener('change', cb)
  }, [])
  const reducedSnapshot = useCallback(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )
  const reducedServer = useCallback(() => false, [])
  const reduced = useSyncExternalStore(reducedSubscribe, reducedSnapshot, reducedServer)

  useEffect(() => {
    if (reduced) return
    const timer = window.setInterval(() => setPhase((p) => p + 1), 2600)
    return () => window.clearInterval(timer)
  }, [reduced])

  return (
    <div className={cn('pointer-events-none select-none', className)} aria-hidden="true">
      <style>{`
        @keyframes vine-grow {
          from { stroke-dashoffset: 1; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes leaf-appear {
          from { opacity: 0; transform: scale(0.7); }
          to { opacity: 0.42; transform: scale(1); }
        }
        @keyframes glyph-swap {
          0% { opacity: 0; transform: scale(0.82); }
          15% { opacity: 1; transform: scale(1); }
          85% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.9); }
        }
        .vine-path {
          stroke-dasharray: 1;
          stroke-dashoffset: ${reduced ? '0' : '1'};
          ${reduced ? '' : 'animation: vine-grow 1.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;'}
        }
        .leaf-node {
          opacity: ${reduced ? '0.42' : '0'};
        }
      `}</style>
      <svg
        viewBox="0 0 1200 520"
        preserveAspectRatio="xMidYMax slice"
        className="h-full w-full"
      >
        {/* Trellis lattice */}
        <g stroke="var(--brand-500, #0E6E62)" strokeOpacity="0.09" strokeWidth="1">
          {Array.from({ length: 14 }).map((_, i) => (
            <line key={`a${i}`} x1={i * 120 - 240} y1={520} x2={i * 120 + 260} y2={0} />
          ))}
          {Array.from({ length: 14 }).map((_, i) => (
            <line key={`b${i}`} x1={i * 120 - 240} y1={0} x2={i * 120 + 260} y2={520} />
          ))}
        </g>

        {/* Climbing vines */}
        {VINES.map((d, i) => (
          <path
            key={`${id}-vine-${i}`}
            d={d}
            fill="none"
            stroke="var(--brand-500, #0E6E62)"
            strokeOpacity={0.34}
            strokeWidth="1.8"
            strokeLinecap="round"
            className="vine-path"
            pathLength={1}
            style={reduced ? undefined : { animationDelay: `${0.18 + i * 0.18}s` }}
          />
        ))}

        {/* Leaf nodes with cycling glyphs */}
        {LEAVES.map((leaf, i) => {
          const delay = 0.5 + leaf.vine * 0.18 + (i % 5) * 0.06
          return (
            <g
              key={`${id}-leaf-${i}`}
              transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.rotate}) scale(${leaf.scale})`}
              className="leaf-node"
              style={
                reduced
                  ? undefined
                  : {
                      animation: `leaf-appear 0.32s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s forwards`,
                    }
              }
            >
              <g
                className="text-brand-500"
                style={{ color: 'var(--brand-500, #0E6E62)' }}
              >
                <Glyph index={phase + i} />
              </g>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
