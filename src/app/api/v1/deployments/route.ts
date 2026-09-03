import { NextRequest } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { db } from '@/db'
import { services, serviceConfigs, deployments } from '@/db/schema'
import { getCurrentUser } from '@/lib/auth'
import { executeDeployment } from '@/lib/deploy'

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { serviceId?: string; environmentId?: string; image?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { serviceId, environmentId, image } = body

  if (!serviceId || !environmentId) {
    return Response.json(
      { error: 'serviceId and environmentId are required' },
      { status: 400 },
    )
  }

  const configRows = await db
    .select()
    .from(serviceConfigs)
    .where(
      and(
        eq(serviceConfigs.serviceId, serviceId),
        eq(serviceConfigs.environmentId, environmentId),
      ),
    )
    .limit(1)

  if (configRows.length === 0) {
    return Response.json(
      { error: 'No service configuration found for this environment' },
      { status: 404 },
    )
  }

  const config = configRows[0]
  const deployImage = image ?? config.image

  if (image) {
    await db
      .update(serviceConfigs)
      .set({ image, updatedAt: new Date() })
      .where(eq(serviceConfigs.id, config.id))
  }

  const [deployment] = await db
    .insert(deployments)
    .values({
      serviceId,
      environmentId,
      imageBefore: config.image,
      imageAfter: deployImage,
      strategy: config.deploymentStrategy,
      status: 'pending',
      triggeredByUserId: user.id,
      triggerType: 'manual',
    })
    .returning({ id: deployments.id })

  executeDeployment(deployment.id).catch(() => {})

  return Response.json({ deploymentId: deployment.id, status: 'pending' })
}
