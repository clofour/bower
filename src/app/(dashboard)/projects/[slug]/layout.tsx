import { redirect, notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getUserOrganization, getProjectBySlug } from '@/lib/queries'
import { PageHeading } from '@/components/page-heading'
import { ProjectTabs } from '@/components/project-tabs'

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const ctx = await getUserOrganization(user.id)
  if (!ctx) redirect('/login')

  const { slug } = await params
  const project = await getProjectBySlug(ctx.org.id, slug)
  if (!project) notFound()

  return (
    <div className="space-y-6">
      <div className="sticky top-16 z-20 -mx-4 border-b bg-background/95 px-4 pb-0 pt-2 backdrop-blur lg:top-0 lg:-mx-10 lg:px-10">
      <PageHeading
        eyebrow="Project"
        title={project.name}
        description={project.description ?? undefined}
      />
      <ProjectTabs slug={slug} />
      </div>
      <div>{children}</div>
    </div>
  )
}
