import { redirect } from 'next/navigation'
import { FileStack } from 'lucide-react'
import { eq, or, isNull } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth'
import { getUserOrganization } from '@/lib/queries'
import { db } from '@/db'
import { serviceTemplates } from '@/db/schema'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function TemplatesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const ctx = await getUserOrganization(user.id)
  if (!ctx) redirect('/login')

  const templates = await db
    .select()
    .from(serviceTemplates)
    .where(
      or(eq(serviceTemplates.orgId, ctx.org.id), isNull(serviceTemplates.orgId)),
    )
    .orderBy(serviceTemplates.name)

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Service Templates</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pre-configured service templates for quick deployment setup
        </p>
      </div>

      {templates.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <FileStack className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No templates</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Templates will appear here when configured.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {templates.map((t) => (
            <Card key={t.id} className="p-5">
              <div className="flex items-start justify-between">
                <h3 className="font-medium">{t.name}</h3>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-xs capitalize">
                    {t.type}
                  </Badge>
                  {t.isBuiltin && (
                    <Badge className="text-xs">Built-in</Badge>
                  )}
                </div>
              </div>
              {t.description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {t.description}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
