import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-2xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-300 focus:ring-offset-1',
  {
    variants: {
      variant: {
        default: 'bg-brand-50 text-brand-700 border-brand-100',
        secondary: 'bg-sunken text-ink-soft border-line',
        destructive: 'bg-danger-50 text-danger-500 border-danger-200',
        outline: 'bg-surface text-ink-soft border-line',
        success: 'bg-brand-50 text-brand-700 border-brand-100',
        warning: 'bg-warn-50 text-warn-500 border-warn-200',
        info: 'bg-info-50 text-info-500 border-info-200',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
