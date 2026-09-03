// ---------------------------------------------------------------------------
// Trellis client factory — singleton / per-org instances
// ---------------------------------------------------------------------------

import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { organizations } from '@/db/schema'
import { TrellisClient } from '@/lib/trellis'

// ---------------------------------------------------------------------------
// Per-org client (reads credentials from the database)
// ---------------------------------------------------------------------------

/**
 * Build a TrellisClient for the given organisation by loading its stored
 * `trellis_api_url` and `trellis_api_token` from the organisations table.
 *
 * Throws if the organisation is not found or if the Trellis credentials have
 * not been configured yet.
 */
export async function getTrellisClient(orgId: string): Promise<TrellisClient> {
  const rows = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1)

  if (rows.length === 0) {
    throw new Error(`Organization not found: ${orgId}`)
  }

  const org = rows[0]

  // The schema will include these columns once the migration runs. Until then
  // the values will be undefined, so we guard with an explicit check.
  const apiUrl = (org as Record<string, unknown>).trellis_api_url as
    | string
    | undefined
  const apiToken = (org as Record<string, unknown>).trellis_api_token as
    | string
    | undefined

  if (!apiUrl || !apiToken) {
    throw new Error(
      `Trellis credentials have not been configured for organization ${orgId}. ` +
        'Set trellis_api_url and trellis_api_token in the organization settings.',
    )
  }

  return new TrellisClient(apiUrl, apiToken)
}

// ---------------------------------------------------------------------------
// Env-var client (for local development / testing / initial setup)
// ---------------------------------------------------------------------------

/**
 * Build a TrellisClient from the `TRELLIS_API_URL` and `TRELLIS_API_TOKEN`
 * environment variables. Useful for CLI scripts, tests, and initial
 * bootstrapping before an organisation record exists.
 *
 * Throws if either variable is missing.
 */
export function getTrellisClientFromEnv(): TrellisClient {
  const apiUrl = process.env.TRELLIS_API_URL
  const apiToken = process.env.TRELLIS_API_TOKEN

  if (!apiUrl) {
    throw new Error(
      'TRELLIS_API_URL environment variable is not set. ' +
        'Set it to the base URL of the Trellis API (e.g. http://localhost:8128).',
    )
  }

  if (!apiToken) {
    throw new Error(
      'TRELLIS_API_TOKEN environment variable is not set. ' +
        'Set it to a valid Trellis bearer token with cluster/write scope.',
    )
  }

  return new TrellisClient(apiUrl, apiToken)
}
