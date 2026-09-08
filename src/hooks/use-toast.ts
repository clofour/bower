import { useState, useCallback } from 'react'

export interface ToastMessage {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

let toastCount = 0

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const toast = useCallback(
    (props: Omit<ToastMessage, 'id'>) => {
      const id = String(++toastCount)
      setToasts((prev) => [...prev, { ...props, id }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 5000)
      return id
    },
    [],
  )

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toasts, toast, dismiss }
}
