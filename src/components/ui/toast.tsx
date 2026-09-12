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
        'pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-xl border p-4 shadow-raised transition-all',
        variant === 'default' && 'border-line bg-surface text-ink',
        variant === 'destructive' && 'border-danger-200 bg-danger-50 text-danger-500',
        className,
      )}
      {...props}
    >
      <div className="flex-1 text-[13px]">{children}</div>
      {onClose && (
        <button onClick={onClose} className="rounded-lg p-1 text-ink-muted transition-colors duration-150 hover:text-ink">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  ),
)
Toast.displayName = 'Toast'

export { Toast }
