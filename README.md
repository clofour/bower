# Canopy

Canopy is an opinionated deployment dashboard built on top of [Trellis](https://github.com/clofour/trellis-experimental). It adds application-platform abstractions — projects, environments, services, deployments, routes, secrets, teams, and an audit trail — while leaving scheduling, placement, and container lifecycle entirely to Trellis.

## Features

- **Projects & environments** — logical groupings with configurable promotion order (staging → production)
- **Services** — Web, Worker, Cron, and Custom types mapped to Trellis jobs
- **Deployments** — auditable history with plan diffs, canary step advancement, and automatic rollback on health failures
- **Managed ingress** — per-namespace Caddy proxy; adding a route writes the config and reloads automatically
- **Secrets** — backed by Trellis namespace secrets; Canopy tracks metadata and rotation without storing values
- **RBAC** — Owner, Admin, Deployer, and Viewer roles scoped per project
- **Audit log** — every mutation recorded with actor, timestamp, and before/after state
- **CI/CD hooks** — inbound deploy endpoint and registry webhooks with HMAC verification

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

trellisctl secrets set database-url   --namespace platform "postgres://canopy:canopy@db.internal:5432/canopy"
trellisctl secrets set encryption-key --namespace platform "<key from above>"
```

### 2. Apply `trellis.yml`

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

```bash
trellisctl jobs apply trellis.yml
```

### 3. Run migrations

Migrations are a manual step and must complete before the new container serves traffic:

```bash
docker run --rm \
  -e DATABASE_URL="postgres://canopy:canopy@db.internal:5432/canopy" \
  ghcr.io/clofour/canopy:latest \
  node -e "require('./src/db/migrate')"
```

### 4. Finish setup

Open Canopy at the node address on port 3000, create the first organization owner, and add your Trellis API URL and token under **Organization → Cluster**.

## Commands

```bash
npm run dev          # Development server (http://localhost:3000)
npm run build        # Production build
npm start            # Production server
npm run lint         # ESLint
npm test             # Test suite
npm run db:generate  # Generate a Drizzle migration from schema changes
npm run db:migrate   # Apply pending migrations
```

## Container image

Tagged releases publish `ghcr.io/clofour/canopy:<version>` and update `ghcr.io/clofour/canopy:latest`. The container listens on port 3000 and runs as a non-root user.

Migrations are not run automatically on startup — run `npm run db:migrate` (or the Docker equivalent) before starting the new container.

## Further reading

- [Configuration reference](docs/configuration.md) — all environment variables and defaults
- [Deployment strategies](docs/deployment-strategies.md) — rolling, recreate, blue-green, canary, and auto-rollback
- [Managed ingress](docs/managed-ingress.md) — how the per-namespace Caddy proxy works
- [CI/CD automation](docs/automation.md) — deploy API and registry webhooks
- [PLAN.md](PLAN.md) — full product model, responsibility boundary, and pending Trellis API additions
