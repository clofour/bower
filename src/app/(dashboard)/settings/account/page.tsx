import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AccountSettingsForm } from '@/components/account-settings-form'

export default async function AccountSettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile and security settings
        </p>
      </div>

      <AccountSettingsForm userName={user.name} userEmail={user.email} />
    </div>
  )
}
