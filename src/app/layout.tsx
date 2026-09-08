import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = { title: { default: 'Bower', template: '%s · Bower' }, description: 'A deliberate control plane for Trellis.' }
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html> }
