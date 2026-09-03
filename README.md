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

- A running Trellis cluster with a credential that has `cluster/write` access
- Node.js 20+ (local development only)

## Quick start

### On Trellis

The `trellis.yml` below includes a bundled Postgres container so you can get running without an external database. It uses host networking and assumes both task groups land on the same node, so it works as-is on a single-node cluster. For multi-node clusters, replace the `db` task group with an external database and store the connection string as a Trellis secret instead. For a demo, data persists across container crashes but is lost if the allocation is replaced.

#### 1. Create the namespace and encryption key secret

```bash
trellisctl namespaces create platform

# Generate a stable 32-byte key — must be identical across all Canopy instances
openssl rand -hex 32

trellisctl secrets set encryption-key --namespace platform "<key from above>"
```

#### 2. Apply `trellis.yml`

```yaml
# trellis.yml
# yaml-language-server: $schema=https://raw.githubusercontent.com/clofour/trellis-experimental/main/schemas/trellis-job.schema.json
name: canopy
namespace: platform
task_groups:
  - name: db
    count: 1
    tasks:
      - name: postgres
        image: docker.io/library/postgres:16-alpine
        networking:
          mode: host
          ports:
            - port: 5432
        resources:
          cpu: 250
          memory: 256MiB
        env:
          POSTGRES_USER: canopy
          POSTGRES_PASSWORD: canopy
          POSTGRES_DB: canopy
        volumes:
          - name: pgdata
            path: /var/lib/postgresql/data
        health_check:
          type: script
          command: ["pg_isready", "-U", "canopy"]
          interval: 5s
          timeout: 5s
          threshold: 3

  - name: web
    count: 1
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
          DATABASE_URL: postgres://canopy:canopy@localhost:5432/canopy
          CANOPY_RECONCILE_INTERVAL: "5"
        secrets:
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

#### 3. Run migrations

Migrations must complete before the Canopy container serves traffic:

```bash
docker run --rm \
  -e DATABASE_URL="postgres://canopy:canopy@<node-ip>:5432/canopy" \
  ghcr.io/clofour/canopy:latest \
  node -e "require('./src/db/migrate')"
```

#### 4. Finish setup

Open Canopy at `http://<node-ip>:3000`, create the first organization owner, and add your Trellis API URL and token under **Organization → Cluster**.

### Local development

#### 1. Start Postgres

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: canopy
      POSTGRES_PASSWORD: canopy
      POSTGRES_DB: canopy
    ports:
      - "5432:5432"
    volumes:
      - db-data:/var/lib/postgresql/data
volumes:
  db-data:
```

```bash
docker compose up -d
```

#### 2. Configure and run

```bash
cp .env.example .env.local
# Set NEXT_SERVER_ACTIONS_ENCRYPTION_KEY to the output of: openssl rand -hex 32
# DATABASE_URL is already set to match the compose service above
npm install
npm run db:migrate
npm run dev
```

Open `http://localhost:3000`, create the first organization owner, then add the Trellis API URL and token under **Organization → Cluster**.

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
