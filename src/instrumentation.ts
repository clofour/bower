declare global {
  var bowerDeploymentMonitor: NodeJS.Timeout | undefined
}

async function seedDefaultOrg() {
  const { db } = await import('@/db')
  const { organizations, inviteTokens } = await import('@/db/schema')
  const { sql } = await import('drizzle-orm')

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(organizations)

  if (count > 0) return

  const apiUrl = process.env.TRELLIS_API_URL ?? ''
  const apiToken = process.env.TRELLIS_API_TOKEN ?? ''

  const [org] = await db
    .insert(organizations)
    .values({
      name: 'Trellis Cluster',
      slug: 'trellis-cluster',
      trellisApiUrl: apiUrl,
      trellisApiToken: apiToken,
    })
    .returning({ id: organizations.id })

  const { randomBytes, createHash } = await import('node:crypto')
  const rawToken = `ci_${randomBytes(24).toString('base64url')}`
  const tokenHash = createHash('sha256').update(rawToken).digest('hex')
  const tokenPrefix = rawToken.slice(0, 11)

  await db.insert(inviteTokens).values({
    orgId: org.id,
    tokenHash,
    tokenPrefix,
    role: 'owner',
    note: 'Bootstrap admin token',
  })

  const line = '═'.repeat(60)
  console.log(`\n╔${line}╗`)
  console.log('║           Bower — First Run Setup                         ║')
  console.log(`╠${line}╣`)
  console.log('║  Use this invite token to create the first account:        ║')
  console.log(`║  ${rawToken.padEnd(58)}║`)
  console.log('║                                                            ║')
  console.log('║  This token is single-use. Keep it safe.                   ║')
  console.log(`╚${line}╝\n`)
}

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs' || globalThis.bowerDeploymentMonitor) return

  await seedDefaultOrg().catch((err) =>
    console.error('Bower default org seeding failed:', err)
  )

  const { reconcileAllDeployments } = await import('@/lib/deployment-reconciler')
  const seconds = Math.max(2, Number(process.env.BOWER_RECONCILE_INTERVAL || 5))
  const reconcile = () => void reconcileAllDeployments().catch((error) => console.error('Bower deployment reconciliation failed:', error))
  reconcile()
  globalThis.bowerDeploymentMonitor = setInterval(reconcile, seconds * 1000)
  globalThis.bowerDeploymentMonitor.unref()
}
