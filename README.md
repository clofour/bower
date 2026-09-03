# Canopy

Canopy is an opinionated deployment dashboard built on top of [Trellis](https://github.com/clofour/trellis-experimental). It adds application-platform abstractions — projects, environments, services, deployments, routes, secrets, teams, and an audit trail — while leaving scheduling, placement, and container lifecycle entirely to Trellis.

## Contents

- [Features](#features)
- [Requirements](#requirements)
- [Quick start — local](#quick-start--local)
- [Quick start — deploy on Trellis](#quick-start--deploy-on-trellis)
- [Configuration](#configuration)
- [Deployment strategies](#deployment-strategies)
- [Managed ingress](#managed-ingress)
- [CI/CD automation](#cicd-automation)
- [Commands](#commands)
- [Container image](#container-image)

## Features

- **Projects & environments** — logical groupings with configurable promotion order (staging → production)
- **Services** — Web, Worker, Cron, and Custom types mapped to Trellis jobs; supports rolling, recreate, blue-green, and canary deployment strategies
- **Deployments** — auditable history with plan diffs, canary step advancement, and automatic rollback on health failures
- **Managed ingress** — Canopy deploys and manages a per-namespace Caddy proxy; adding a route writes the config and reloads the proxy automatically
- **Secrets** — backed by Trellis namespace secrets; Canopy adds metadata and rotation tracking without ever storing values itself
- **RBAC** — Owner, Admin, Deployer, and Viewer roles scoped per project
- **Audit log** — every mutation recorded with actor, timestamp, and before/after state
- **CI/CD hooks** — inbound deploy endpoint and registry webhooks (Docker Hub, GHCR, generic) with HMAC verification

## Requirements

- Node.js 20+
- PostgreSQL
- A running Trellis cluster with a credential that has `cluster/write` access

## Quick start — local

```bash
cp .env.example .env.local
# Fill in DATABASE_URL and NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
npm install
npm run db:migrate
npm run dev
```

Open `http://localhost:3000`, create the first organization owner, then add the Trellis API URL and token under **Organization → Cluster**.

## Quick start — deploy on Trellis

### 1. Create the namespace and secrets

```bash
trellisctl namespaces create platform

# Generate a stable 32-byte key (same value across all Canopy instances)
openssl rand -hex 32

trellisctl secrets set database-url      --namespace platform "postgres://canopy:canopy@db.internal:5432/canopy"
trellisctl secrets set encryption-key    --namespace platform "<key from above>"
```

### 2. Apply `trellis.yml`

Save the file below alongside your cluster config and apply it:

```bash
trellisctl jobs apply trellis.yml
```

```yaml
# trellis.yml
# yaml-language-server: $schema=https://raw.githubusercontent.com/clofour/trellis-experimental/main/schemas/trellis-job.schema.json
name: canopy
namespace: platform
task_groups:
  - name: web
    count: 2
    update:
      strategy: rolling
      max_parallel: 1
    tasks:
      - name: canopy
        image: ghcr.io/clofour/canopy:latest
        networking:
          mode: host
          ports:
            - port: 3000
        resources:
          cpu: 500
          memory: 512MiB
        env:
          NODE_ENV: production
          CANOPY_RECONCILE_INTERVAL: "5"
        secrets:
          - name: database-url
            target: env
            env: DATABASE_URL
          - name: encryption-key
            target: env
            env: NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
        health_check:
          type: http
          port: 3000
          path: /
          interval: 10s
          timeout: 5s
          threshold: 2
```

### 3. Run migrations

Migrations are a manual step and must complete before the new container starts serving traffic:

```bash
docker run --rm \
  -e DATABASE_URL="postgres://canopy:canopy@db.internal:5432/canopy" \
  ghcr.io/clofour/canopy:latest \
  node -e "require('./src/db/migrate')"
```

Or run `npm run db:migrate` from a local checkout pointed at the production `DATABASE_URL`.

### 4. Finish setup

Once the allocations are healthy, open Canopy at the node address on port 3000, create the first organization owner, and add your Trellis API URL and token under **Organization → Cluster**.

## Configuration

All configuration is via environment variables. Copy `.env.example` for the full list.

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | Yes | — | 32-byte hex key; must be identical across all instances |
| `CANOPY_CADDY_IMAGE` | No | `ghcr.io/clofour/canopy-caddy:latest` | Override when using a private registry |
| `CANOPY_PROXY_SYNC_IMAGE` | No | `ghcr.io/clofour/canopy-proxy-sync:latest` | Override when using a private registry |
| `CANOPY_PROXY_HTTP_PORT` | No | `80` | Host port for managed ingress HTTP listener |
| `CANOPY_PROXY_HTTPS_PORT` | No | `443` | Host port for managed ingress HTTPS listener |
| `CANOPY_RECONCILE_INTERVAL` | No | `5` | Deployment reconciliation cadence in seconds |

## Deployment strategies

Canopy implements four strategies on top of Trellis primitives:

| Strategy | How it works |
|---|---|
| **Rolling** | Uses Trellis's native rolling update; Canopy watches allocation health during rollout |
| **Recreate** | Uses Trellis's native recreate strategy |
| **Blue-green** | Creates a second job, waits for it to be healthy, switches the route, then removes the old job |
| **Canary** | Creates a canary job with a `trellis/weight` label; Canopy advances weight and replica count over configurable steps and rolls back automatically if health degrades |

Automatic rollback triggers when allocations remain unhealthy beyond the configured threshold (default: 5 minutes). The previous known-good job spec is re-applied and the event is recorded as a `rolled-back` deployment.

## Managed ingress

Creating a route on a service causes Canopy to:

1. Generate a Caddyfile and write it to Trellis secrets in the target namespace
2. Deploy (or update) a namespace-local Caddy + route-sync task group
3. Keep the sync task watching healthy allocations via `api_access: namespace/read`, updating upstreams as allocations come and go, and reloading Caddy through its admin API

Canopy tells you what DNS record to create; it does not manage DNS itself.

Override the proxy images when hosting from a private registry:

```bash
CANOPY_CADDY_IMAGE=registry.example.com/canopy-caddy:latest
CANOPY_PROXY_SYNC_IMAGE=registry.example.com/canopy-proxy-sync:latest
```

## CI/CD automation

### Deploy API

Trigger a deployment from any CI system using an API key created in **Account → API keys**:

```bash
curl -X POST https://canopy.example.com/api/deploy \
  -H "Authorization: Bearer <api-key>" \
  -H "Content-Type: application/json" \
  -d '{"serviceId": "<id>", "environmentId": "<id>", "image": "ghcr.io/org/app:v1.2.3"}'
```

### Registry webhooks

Create an inbound endpoint under **Project → Integrations**. The endpoint token doubles as the HMAC-SHA256 signing secret. Canopy accepts signatures in `X-Canopy-Signature` or `X-Hub-Signature-256` and supports Docker Hub, GHCR, and generic registry payloads.

## Commands

```bash
npm run dev          # Start the development server (http://localhost:3000)
npm run build        # Build for production
npm start            # Start the production server
npm run lint         # Run ESLint
npm test             # Run the test suite
npm run db:generate  # Generate a new Drizzle migration from schema changes
npm run db:migrate   # Apply pending migrations
```

## Container image

Tagged releases publish `ghcr.io/clofour/canopy:<version>` and update `ghcr.io/clofour/canopy:latest`. The container listens on port 3000 and runs as a non-root user.

Database migrations are not run automatically on startup — run `npm run db:migrate` (or the Docker equivalent) before starting the new container.

See [PLAN.md](./PLAN.md) for the full product model, responsibility boundary, and Trellis API additions that are currently no-ops.
