import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive'
  onClose?: () => void
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant = 'default', onClose, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-md border p-4 shadow-lg transition-all',
        variant === 'default' && 'border bg-background text-foreground',
        variant === 'destructive' && 'border-destructive bg-destructive text-destructive-foreground',
        className,
      )}
      {...props}
    >
      <div className="flex-1 text-sm">{children}</div>
      {onClose && (
        <button onClick={onClose} className="rounded-md p-1 opacity-70 transition-opacity hover:opacity-100">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  ),
)
Toast.displayName = 'Toast'

export { Toast }
