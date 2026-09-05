import { Sprout } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Brand({ compact = false, inverse = false }: { compact?: boolean; inverse?: boolean }) {
  return <div className="flex items-center gap-2.5">
    <span className={cn('grid h-8 w-8 place-items-center rounded-lg',
      inverse ? 'bg-white text-[hsl(224,45%,16%)]' : 'bg-primary text-primary-foreground')}>
      <Sprout className="h-4 w-4" strokeWidth={2.4} />
    </span>
    {!compact && <span className={cn('text-base font-bold tracking-[-0.02em]', inverse ? 'text-white' : 'text-foreground')}>Bower</span>}
  </div>
}
