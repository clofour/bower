'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { loginAction, registerAction } from '@/lib/auth-actions'

type State = { error?: string }

export function LoginForm() {
  const [state, action, pending] = useActionState<State, FormData>(
    async (_previous, formData) => loginAction(formData),
    {},
  )

  return (
    <div className="auth-form-panel">
      <h2>Sign in</h2>
      <p>Use the account attached to this Bower instance.</p>
      <form action={action} className="auth-form">
        {state.error ? <div className="form-error" role="alert">{state.error}</div> : null}
        <div className="field">
          <label htmlFor="login-email">Email</label>
          <input id="login-email" className="input" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="field">
          <label htmlFor="login-password">Password</label>
          <input id="login-password" className="input" name="password" type="password" autoComplete="current-password" required />
        </div>
        <button className="button button-primary" type="submit" disabled={pending}>
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <div className="auth-switch">
        Have an invite or instance token? <Link href="/register">Create an account</Link>
      </div>
    </div>
  )
}

export function RegisterForm() {
  const [state, action, pending] = useActionState<State, FormData>(
    async (_previous, formData) => registerAction(formData),
    {},
  )

  return (
    <div className="auth-form-panel">
      <h2>Create an account</h2>
      <p>Registration requires a single-use instance or organization invite token.</p>
      <form action={action} className="auth-form">
        {state.error ? <div className="form-error" role="alert">{state.error}</div> : null}
        <div className="field">
          <label htmlFor="register-name">Name</label>
          <input id="register-name" className="input" name="name" autoComplete="name" required />
        </div>
        <div className="field">
          <label htmlFor="register-email">Email</label>
          <input id="register-email" className="input" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="field">
          <label htmlFor="register-password">Password</label>
          <input id="register-password" className="input" name="password" type="password" minLength={8} autoComplete="new-password" required />
          <span className="field-hint">At least 8 characters.</span>
        </div>
        <div className="field">
          <label htmlFor="invite-token">Invite token</label>
          <input id="invite-token" className="input mono" name="inviteToken" autoComplete="off" required />
        </div>
        <button className="button button-primary" type="submit" disabled={pending}>
          {pending ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <div className="auth-switch">
        Already have an account? <Link href="/login">Sign in</Link>
      </div>
    </div>
  )
}
