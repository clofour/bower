import { Leaf } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Brand({ className, size = 'default' }: { className?: string; size?: 'sm' | 'default' | 'lg' }) {
  const iconSize = size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6'
  const textSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg'

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center justify-center rounded-lg bg-primary p-1.5">
        <Leaf className={cn(iconSize, 'text-primary-foreground')} />
      </div>
      <span className={cn('font-semibold tracking-tight', textSize)}>Bower</span>
    </div>
  )
}
