'use client'

import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export function NoopButton({ children, feature, variant = 'outline', className }: {
  children: ReactNode; feature: string; variant?: 'outline' | 'ghost' | 'secondary' | 'destructive'; className?: string
}) {
  const { toast } = useToast()
  return <Button type="button" variant={variant} className={className} onClick={() => toast({
    title: `${feature} is not available yet`,
    description: 'The control is ready, but Trellis does not expose the required API yet.',
  })}>{children}</Button>
}
