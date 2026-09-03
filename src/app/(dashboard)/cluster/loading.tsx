import { Card } from '@/components/ui/card'

export default function ClusterLoading() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <div className="h-8 w-24 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-56 animate-pulse rounded bg-muted" />
      </div>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-8 w-20 animate-pulse rounded bg-muted" />
          </Card>
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 animate-pulse rounded-md bg-muted" />
              <div className="space-y-2">
                <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div className="h-1.5 w-full animate-pulse rounded-full bg-muted" />
              <div className="h-1.5 w-full animate-pulse rounded-full bg-muted" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
