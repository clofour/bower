import { redirect } from 'next/navigation'
import { Key } from 'lucide-react'
import { eq } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth'
import { getUserOrganization } from '@/lib/queries'
import { db } from '@/db'
import { apiKeys, users } from '@/db/schema'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreateApiKeyDialog } from '@/components/create-api-key-dialog'

export default async function ApiKeysPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const ctx = await getUserOrganization(user.id)
  if (!ctx) redirect('/login')

  const canManage = ctx.role === 'owner' || ctx.role === 'admin'

  const keyList = await db
    .select({
      key: apiKeys,
      userName: users.name,
    })
    .from(apiKeys)
    .innerJoin(users, eq(users.id, apiKeys.userId))
    .where(eq(apiKeys.orgId, ctx.org.id))

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">API Keys</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage API keys for webhook and programmatic access
          </p>
        </div>
        {canManage && <CreateApiKeyDialog />}
      </div>

      {keyList.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Key className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No API keys</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create an API key to enable webhook deployments.
          </p>
          {canManage && (
            <div className="mt-4">
              <CreateApiKeyDialog />
            </div>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {keyList.map((k) => (
            <Card key={k.key.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                    <Key className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium">{k.key.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-mono">{k.key.keyPrefix}...</span>
                      {' '}by {k.userName}
                    </p>
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>
                    Created{' '}
                    {new Date(k.key.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  {k.key.lastUsedAt && (
                    <p>
                      Last used{' '}
                      {new Date(k.key.lastUsedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
