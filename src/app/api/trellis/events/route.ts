import { getCurrentUser } from '@/lib/auth'
import { getUserOrganization } from '@/lib/queries'
import { getTrellisClient } from '@/lib/trellis-instance'

export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user) return new Response('Unauthorized', { status: 401 })
  const ctx = await getUserOrganization(user.id)
  if (!ctx?.org.trellisApiUrl || !ctx.org.trellisApiToken) {
    return new Response('Trellis not configured', { status: 503 })
  }
  const { searchParams } = new URL(request.url)
  const namespace = searchParams.get('namespace') ?? undefined
  const client = await getTrellisClient(ctx.org.id)
  let upstream: Response
  try {
    upstream = await client.streamEvents(namespace)
  } catch {
    return new Response('Trellis unreachable', { status: 502 })
  }
  if (!upstream.ok) {
    return new Response('Trellis event stream unavailable', { status: 502 })
  }
  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  })
}
