import { Leaf } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Brand({ className, size = 'default' }: { className?: string; size?: 'sm' | 'default' | 'lg' }) {
  const iconSize = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6'
  const boxPad = size === 'sm' ? 'p-1' : 'p-1.5'
  const boxRadius = size === 'sm' ? 'rounded-[6px]' : 'rounded-lg'
  const textSize = size === 'sm' ? 'text-[17px]' : size === 'lg' ? 'text-2xl' : 'text-lg'

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex items-center justify-center bg-primary', boxPad, boxRadius)}>
        <Leaf className={cn(iconSize, 'text-primary-foreground')} />
      </div>
      <span className={cn('font-bold tracking-tightest', textSize)}>bower</span>
    </div>
  )
}
