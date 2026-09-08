import Link from 'next/link'
import { FolderSearch } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
export default function ProjectNotFound() { return <EmptyState icon={<FolderSearch className="h-5 w-5"/>} title="Project not found" description="This project may have been removed, renamed, or is outside your current organization access." action={<Button asChild variant="outline"><Link href="/projects">Return to projects</Link></Button>} /> }
