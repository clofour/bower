import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <h1 className="text-6xl font-bold tracking-tighter text-foreground">404</h1>
      <p className="mt-2 text-lg text-muted-foreground">Page not found</p>
      <Button asChild className="mt-6">
        <Link href="/projects">Go to Projects</Link>
      </Button>
    </div>
  )
}
