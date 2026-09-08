import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { ProjectNav } from '@/components/project-nav'
import { getCurrentUser } from '@/lib/auth'
import { getProjectBySlug, getUserOrganization } from '@/lib/queries'
import { requireProject } from '@/lib/actions/shared'

export default async function ProjectLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const user = await getCurrentUser()
  if (!user) notFound()
  const context = await getUserOrganization(user.id)
  if (!context) notFound()
  const project = await getProjectBySlug(context.org.id, slug)
  if (!project) notFound()

  let access
  try {
    access = await requireProject(project.id)
  } catch {
    notFound()
  }

  return (
    <>
      <header className="project-header">
        <div className="eyebrow">Project · {access.projectRole}</div>
        <div className="project-header-row">
          <h1 className="page-title">{project.name}</h1>
          <span className="project-slug">{project.slug}</span>
        </div>
        {project.description ? <p className="page-description">{project.description}</p> : null}
        <ProjectNav slug={project.slug} />
      </header>
      {children}
    </>
  )
}
