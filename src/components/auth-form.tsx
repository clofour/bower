'use client'
import Link from 'next/link'
import { useActionState } from 'react'
import { loginAction, registerAction } from '@/lib/auth-actions'

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const action = async (_state: { error?: string }, formData: FormData) => mode === 'login' ? loginAction(formData) : registerAction(formData)
  const [state, formAction, pending] = useActionState(action, {})
  const register = mode === 'register'
  return <form className="form" action={formAction}>
    {register && <div className="field"><label htmlFor="name">Full name</label><input className="input" id="name" name="name" autoComplete="name" required /></div>}
    <div className="field"><label htmlFor="email">Email address</label><input className="input" id="email" name="email" type="email" autoComplete="email" placeholder="you@company.com" required /></div>
    <div className="field"><label htmlFor="password">Password</label><input className="input" id="password" name="password" type="password" autoComplete={register ? 'new-password' : 'current-password'} minLength={register ? 8 : undefined} required /></div>
    {register && <div className="field"><label htmlFor="inviteToken">Invite token</label><input className="input mono" id="inviteToken" name="inviteToken" autoComplete="off" required /><small style={{color:'var(--muted)'}}>Use the one-time token from your administrator.</small></div>}
    {state?.error && <div className="error" role="alert">{state.error}</div>}
    <button className="btn btn-primary" disabled={pending}>{pending ? 'Connecting…' : register ? 'Create account' : 'Sign in'}</button>
    <p className="auth-link">{register ? <>Already have access? <Link href="/login">Sign in</Link></> : <>Joining a workspace? <Link href="/register">Create an account</Link></>}</p>
  </form>
}
