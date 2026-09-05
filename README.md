# Bower

Bower is an opinionated deployment dashboard built on top of [Trellis](https://github.com/clofour/trellis-experimental). It adds application-platform abstractions — projects, environments, services, deployments, routes, secrets, teams, and an audit trail — while leaving scheduling, placement, and container lifecycle entirely to Trellis.

## Features

- **Projects & environments** — logical groupings with configurable promotion order (staging → production)
- **Services** — Web, Worker, Cron, and Custom types mapped to Trellis jobs
- **Deployments** — auditable history with plan diffs, canary step advancement, and automatic rollback on health failures
- **Managed ingress** — per-namespace Caddy proxy; adding a route writes the config and reloads automatically
- **Secrets** — backed by Trellis namespace secrets; Bower tracks metadata and rotation without storing values
- **RBAC** — Owner, Admin, Deployer, and Viewer roles scoped per project
- **Audit log** — every mutation recorded with actor, timestamp, and before/after state
- **CI/CD hooks** — inbound deploy endpoint and registry webhooks with HMAC verification

## Requirements

- A running Trellis cluster with a credential that has `cluster/write` access
- Node.js 20+ (local development only)

## Quick start

### On Trellis

The `trellis.yml` below includes a bundled Postgres container so you can get running without an external database. It uses host networking and assumes both task groups land on the same node, so it works as-is on a single-node cluster. For multi-node clusters, replace the `db` task group with an external database and store the connection string as a Trellis secret instead. For a demo, data persists across container crashes but is lost if the allocation is replaced.

#### 1. Set the encryption key secret

```bash
# Generate a stable 32-byte key and store it — must be identical across all Bower instances
openssl rand -hex 32 | trellisctl --namespace platform secrets set encryption-key --stdin
```

#### 2. Apply `trellis.yml`

```yaml
# trellis.yml
# yaml-language-server: $schema=https://raw.githubusercontent.com/clofour/trellis-experimental/main/schemas/trellis-job.schema.json
name: bower
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
          POSTGRES_USER: bower
          POSTGRES_PASSWORD: bower
          POSTGRES_DB: bower
        volumes:
          - name: pgdata
            path: /var/lib/postgresql/data
        health_check:
          type: script
          command: ["pg_isready", "-U", "bower"]
          interval: 5s
          timeout: 5s
          threshold: 3

  - name: web
    count: 1
    update:
      strategy: rolling
      max_parallel: 1
    tasks:
      - name: bower
        image: ghcr.io/clofour/bower:latest
        networking:
          mode: host
          ports:
            - port: 3000
        resources:
          cpu: 500
          memory: 512MiB
        env:
          NODE_ENV: production
          DATABASE_URL: postgres://bower:bower@localhost:5432/bower
          BOWER_RECONCILE_INTERVAL: "5"
          AUTO_MIGRATE: "true"
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
trellisctl jobs apply --file trellis.yml
```

#### 3. Migrations

With `AUTO_MIGRATE=true` (set in the manifest above), the container applies pending migrations on startup before the app begins serving traffic. No manual step is needed.

To run migrations manually instead, unset `AUTO_MIGRATE` and run from a local clone once the `db` allocation is healthy:

```bash
git clone https://github.com/clofour/trellis-dashboard.git
cd trellis-dashboard
npm install
DATABASE_URL="postgres://bower:bower@<node-ip>:5432/bower" npm run db:migrate
```

Check progress with `trellisctl jobs status bower`.

#### 4. Finish setup

Open Bower at `http://<node-ip>:3000`, create the first organization owner, and add your Trellis API URL and token under **Organization → Cluster**.

### Local development

#### 1. Start Postgres

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: bower
      POSTGRES_PASSWORD: bower
      POSTGRES_DB: bower
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

Tagged releases publish `ghcr.io/clofour/bower:<version>` and update `ghcr.io/clofour/bower:latest`. The container listens on port 3000 and runs as a non-root user.

When `AUTO_MIGRATE=true` is set, the container applies pending migrations on startup. Otherwise, run `npm run db:migrate` before starting the new container.

## Further reading

- [Configuration reference](docs/configuration.md) — all environment variables and defaults
- [Deployment strategies](docs/deployment-strategies.md) — rolling, recreate, blue-green, canary, and auto-rollback
- [Managed ingress](docs/managed-ingress.md) — how the per-namespace Caddy proxy works
- [CI/CD automation](docs/automation.md) — deploy API and registry webhooks
- [PLAN.md](PLAN.md) — full product model, responsibility boundary, and pending Trellis API additions
