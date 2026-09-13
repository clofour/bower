'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const DialogOpenContext = React.createContext(false)

function Dialog({ children, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root>) {
  const [internalOpen, setInternalOpen] = React.useState(props.defaultOpen ?? false)
  const open = props.open !== undefined ? props.open : internalOpen

  return (
    <DialogOpenContext.Provider value={open}>
      <DialogPrimitive.Root
        {...props}
        onOpenChange={(v) => {
          setInternalOpen(v)
          props.onOpenChange?.(v)
        }}
      >
        {children}
      </DialogPrimitive.Root>
    </DialogOpenContext.Provider>
  )
}

const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn('fixed inset-0 z-50 bg-ink/25', className)}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const open = React.useContext(DialogOpenContext)
  const reduced = useReducedMotion()

  return (
    <AnimatePresence>
      {open && (
        <DialogPortal forceMount>
          <DialogPrimitive.Overlay asChild forceMount>
            <motion.div
              className="fixed inset-0 z-50 bg-ink/25"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            />
          </DialogPrimitive.Overlay>
          <DialogPrimitive.Content asChild ref={ref} forceMount {...props}>
            <motion.div
              className={cn(
                'fixed left-[50%] top-[50%] z-50 grid w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border border-line bg-surface shadow-pop',
                className,
              )}
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 4 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </DialogPrimitive.Content>
        </DialogPortal>
      )}
    </AnimatePresence>
  )
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-start justify-between gap-6 border-b border-line px-5 py-4', className)}>
    <div className="min-w-0" {...props} />
    <DialogPrimitive.Close className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-[background-color,color] duration-150 ease-enter hover:bg-black/[0.04] hover:text-ink focus:outline-none focus:ring-2 focus:ring-brand-300">
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </DialogPrimitive.Close>
  </div>
)

const DialogBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('max-h-[62vh] overflow-y-auto px-5 py-4 scroll-thin', className)} {...props} />
)

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center justify-end gap-2 border-t border-line bg-sunken px-5 py-3', className)} {...props} />
)

const DialogTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn('text-[15px] font-semibold tracking-tight text-ink', className)} {...props} />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn('mt-1 text-[13px] leading-relaxed text-ink-muted', className)} {...props} />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export { Dialog, DialogPortal, DialogOverlay, DialogClose, DialogTrigger, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogTitle, DialogDescription }
