# Configuration

All configuration is via environment variables. Copy `.env.example` at the repo root for a starting point.

## Required

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string, e.g. `postgres://canopy:canopy@localhost:5432/canopy` |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | 32-byte hex key used to encrypt server action payloads. Must be identical across all Canopy instances in a multi-instance deployment. Generate with `openssl rand -hex 32`. |

## Managed ingress

| Variable | Default | Description |
|---|---|---|
| `CANOPY_CADDY_IMAGE` | `ghcr.io/clofour/canopy-caddy:latest` | Caddy image used for the per-namespace proxy job. Override when pulling from a private registry. |
| `CANOPY_PROXY_SYNC_IMAGE` | `ghcr.io/clofour/canopy-proxy-sync:latest` | Route-sync sidecar image. Override when pulling from a private registry. |
| `CANOPY_PROXY_HTTP_PORT` | `80` | Host port for the managed ingress HTTP listener. |
| `CANOPY_PROXY_HTTPS_PORT` | `443` | Host port for the managed ingress HTTPS listener. |

## Reconciliation

| Variable | Default | Description |
|---|---|---|
| `CANOPY_RECONCILE_INTERVAL` | `5` | How often (in seconds) the background reconciler checks active rollouts, advances canary steps, and triggers auto-rollback. |
