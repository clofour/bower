import { NextRequest } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { createHmac, timingSafeEqual } from 'crypto'
import { db } from '@/db'
import {
  webhookEndpoints,
  services,
  serviceConfigs,
  deployments,
  environments,
} from '@/db/schema'

export async function POST(request: NextRequest) {
  const token = request.headers.get('x-canopy-token')
  if (!token) {
    return Response.json({ error: 'Missing x-canopy-token header' }, { status: 401 })
  }

  const body = await request.text()
  const signature = request.headers.get('x-canopy-signature')

  const { hash } = await import('bcryptjs')
  const { compare } = await import('bcryptjs')

  const endpoints = await db.select().from(webhookEndpoints)

  let matched: (typeof endpoints)[0] | null = null
  for (const ep of endpoints) {
    const tokenMatch = await compare(token, ep.tokenHash)
    if (tokenMatch) {
      matched = ep
      break
    }
  }

  if (!matched) {
    return Response.json({ error: 'Invalid token' }, { status: 401 })
  }

  if (!matched.isActive) {
    return Response.json({ error: 'Webhook endpoint is disabled' }, { status: 403 })
  }

  let payload: { image?: string; tag?: string }
  try {
    payload = JSON.parse(body)
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const image = payload.image
  if (typeof image !== 'string' || !image) {
    return Response.json({ error: 'Missing "image" field' }, { status: 400 })
  }

  if (matched.tagFilter && payload.tag) {
    const pattern = new RegExp(`^${matched.tagFilter.replace(/\*/g, '.*')}$`)
    if (!pattern.test(payload.tag)) {
      return Response.json({ message: 'Tag does not match filter, skipping' }, { status: 200 })
    }
  }

  const configRows = await db
    .select()
    .from(serviceConfigs)
    .where(
      and(
        eq(serviceConfigs.serviceId, matched.serviceId),
        eq(serviceConfigs.environmentId, matched.environmentId),
      ),
    )
    .limit(1)

  if (configRows.length === 0) {
    return Response.json({ error: 'No service config found' }, { status: 404 })
  }

  const config = configRows[0]

  await db
    .update(serviceConfigs)
    .set({ image, updatedAt: new Date() })
    .where(eq(serviceConfigs.id, config.id))

  const [deployment] = await db
    .insert(deployments)
    .values({
      serviceId: matched.serviceId,
      environmentId: matched.environmentId,
      imageBefore: config.image,
      imageAfter: image,
      strategy: config.deploymentStrategy,
      status: 'pending',
      triggerType: 'webhook',
    })
    .returning({ id: deployments.id })

  return Response.json({
    message: 'Deployment triggered',
    deploymentId: deployment.id,
  })
}
