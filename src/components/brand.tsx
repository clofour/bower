import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn('h-6 w-6', className)}
    >
      <rect x="0.5" y="0.5" width="23" height="23" rx="6" fill="var(--brand-500, #0E6E62)" />
      <path
        d="M6.5 18.5V12a5.5 5.5 0 0 1 11 0v6.5"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M12 18.5V9"
        stroke="white"
        strokeOpacity="0.55"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M12 13c1.6 0 2.6-.9 2.9-2.6-1.7-.2-2.8.6-2.9 2.6Z"
        fill="white"
        fillOpacity="0.9"
      />
      <path
        d="M12 10.4c-1.5 0-2.4-.9-2.7-2.4 1.6-.2 2.6.5 2.7 2.4Z"
        fill="white"
        fillOpacity="0.6"
      />
    </svg>
  )
}

export function Wordmark({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark className={markClassName} />
      <span className="text-[17px] font-bold tracking-tightest text-ink">bower</span>
    </span>
  )
}

export function Brand({ className, size = 'default' }: { className?: string; size?: 'sm' | 'default' | 'lg' }) {
  const markSize = size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6'
  const textSize = size === 'sm' ? 'text-[17px]' : size === 'lg' ? 'text-2xl' : 'text-lg'

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark className={markSize} />
      <span className={cn('font-bold tracking-tightest text-ink', textSize)}>bower</span>
    </span>
  )
}
