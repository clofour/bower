import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getUserOrganization, getTemplates } from '@/lib/queries'
import { PageHeading } from '@/components/page-heading'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TemplateActions } from './template-actions'
import { BookTemplate } from 'lucide-react'

export default async function TemplatesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const orgCtx = await getUserOrganization(user.id)
  if (!orgCtx) redirect('/login')

  const templates = await getTemplates(orgCtx.org.id)

  return (
    <div className="space-y-6">
      <PageHeading
        title="Service Templates"
        description="Pre-configured service templates for quick setup."
        actions={<TemplateActions mode="create" />}
      />

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <BookTemplate className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-muted-foreground">No templates available.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <Card key={t.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{t.name}</CardTitle>
                    {t.description && <CardDescription>{t.description}</CardDescription>}
                  </div>
                  {!t.isBuiltin && <TemplateActions mode="delete" templateId={t.id} templateName={t.name} />}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{t.type}</Badge>
                  {t.isBuiltin && <Badge variant="outline">Built-in</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
