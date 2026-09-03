import { Card } from '@/components/ui/card'

export default function ProjectsLoading() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="h-8 w-32 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-48 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-9 w-28 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-5">
            <div className="h-9 w-9 animate-pulse rounded-md bg-muted" />
            <div className="mt-3 h-5 w-28 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-3 w-full animate-pulse rounded bg-muted" />
            <div className="mt-4 h-3 w-20 animate-pulse rounded bg-muted" />
          </Card>
        ))}
      </div>
    </div>
  )
}
