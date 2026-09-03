import { Sprout } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Brand({ compact = false, inverse = false }: { compact?: boolean; inverse?: boolean }) {
  return <div className="flex items-center gap-2.5">
    <span className={cn('grid h-8 w-8 place-items-center rounded-xl shadow-[0_8px_22px_-10px_hsl(var(--primary))]',
      inverse ? 'bg-white text-[hsl(224,45%,16%)]' : 'bg-primary text-primary-foreground')}>
      <Sprout className="h-4 w-4" strokeWidth={2.4} />
    </span>
    {!compact && <span className={cn('text-[15px] font-black tracking-[-0.03em]', inverse && 'text-white')}>Bower</span>}
  </div>
}
