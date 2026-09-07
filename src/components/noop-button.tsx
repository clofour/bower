'use client'

import { Button } from '@/components/ui/button'
import type { ButtonProps } from '@/components/ui/button'

export function NoopButton(props: ButtonProps) {
  return <Button {...props} onClick={() => {}} />
}
