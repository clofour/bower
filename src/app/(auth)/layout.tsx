import type { ReactNode } from 'react'
import { AuthScene } from '@/components/auth-scene'
import { Brand } from '@/components/brand'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page">
      <AuthScene />
      <div className="auth-shell">
        <section className="auth-intro">
          <Brand />
          <h1>Deploy with less ceremony.</h1>
          <p>Bower turns Trellis into a focused application platform: environments, releases, routes, secrets, and operations in one place.</p>
        </section>
        {children}
      </div>
    </main>
  )
}
