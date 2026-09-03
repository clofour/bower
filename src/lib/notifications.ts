import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { notificationChannels } from '@/db/schema'

export async function sendDeploymentNotifications(projectId: string, payload: Record<string, unknown>) {
  const channels = await db.select().from(notificationChannels).where(eq(notificationChannels.projectId, projectId))
  await Promise.allSettled(channels.filter((channel) => channel.isActive).map(async (channel) => {
    const config = channel.config as { url?: string }
    if (!config.url) return
    const body = channel.type === 'slack'
      ? { text: `Canopy deployment ${payload.status}: ${payload.service} → ${payload.environment} (${payload.image})`, attachments: [{ fields: Object.entries(payload).map(([title, value]) => ({ title, value: String(value), short: true })) }] }
      : channel.type === 'discord'
        ? { content: `Canopy deployment **${payload.status}**`, embeds: [{ fields: Object.entries(payload).map(([name, value]) => ({ name, value: String(value), inline: true })) }] }
        : payload
    const response = await fetch(config.url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(10_000) })
    if (!response.ok) throw new Error(`Notification ${channel.name} returned ${response.status}.`)
  }))
}
