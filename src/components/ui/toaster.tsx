'use client'

import { useToast } from '@/hooks/use-toast'
import { Toast } from '@/components/ui/toast'

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} variant={t.variant} onClose={() => dismiss(t.id)}>
          {t.title && <p className="font-medium">{t.title}</p>}
          {t.description && <p className="text-sm opacity-90">{t.description}</p>}
        </Toast>
      ))}
    </div>
  )
}
