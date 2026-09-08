import { cn } from '@/lib/utils'

export function Brand({ className, size = 'default' }: { className?: string; size?: 'sm' | 'default' | 'lg' }) {
  const iconSize = size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6'
  const textSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg'

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative flex items-center justify-center rounded-lg bg-primary p-1.5" aria-hidden="true">
        <svg viewBox="0 0 24 24" className={iconSize} fill="none"><path d="M4 18V9l8-5 8 5v9l-8 3-8-3Z" stroke="currentColor" strokeWidth="1.8"/><path d="m4 9 8 4 8-4M12 13v8" stroke="currentColor" strokeWidth="1.8"/></svg>
      </div>
      <span className={cn('font-semibold tracking-[-.025em]', textSize)}>Bower</span>
    </div>
  )
}
