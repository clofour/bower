# Bower — Planning Document

Bower is an opinionated deployment platform built on top of Trellis. Where the builtin Trellis dashboard deliberately mirrors `trellisctl` and exposes raw Trellis primitives, Bower adds application-platform abstractions that make common deployment patterns easy without requiring the operator to compose them manually.

Bower is a standalone Next.js web application with its own PostgreSQL database. It connects to one Trellis cluster using a `cluster/write` operator credential. All scheduling, reconciliation, and container lifecycle stays in Trellis. Bower owns the platform layer: projects, environments, teams, deployment history, routing, and audit.

**Bower does not:**
- Build container images (handled by CI/CD or a separate platform)
- Host a container registry
- Provision nodes or set up clusters
- Manage DNS records (it tells you what to create)
- Manage persistent storage beyond what Trellis host volumes provide
- Provide a CLI

## Architecture

```
                    +---------------------+
                    |   Bower Web UI     |
                    |   (Next.js + React) |
                    +----------+----------+
                               |
                    +----------v----------+
                    |  Bower Backend     |
                    |  (Next.js API       |
                    |   routes + Postgres)|
                    +----------+----------+
                               | cluster/write credential
                    +----------v----------+
                    |  Trellis Cluster    |
                    |  HTTP API (:8128)   |
                    +---------------------+
```

## Visual Style

Clean, modern, confident. Generous whitespace, split layouts where appropriate, bold typography. Bower's own color identity (not copying the Trellis dashboard or any reference). Cool-toned palette. The UI should feel opinionated and polished — not a generic admin panel.

## 1. Projects

A project is the top-level organizational unit.

**Fields:**
- Name, slug, description
- Owning team
- Linked container registry (registry URL + optional credentials for pull-through)
- Created/updated timestamps

**Behavior:**
- Creating a project does not immediately create Trellis namespaces — those are created lazily when an environment gets its first deployment
- A project contains services and environments
- Deleting a project requires deleting all services and environments first (with confirmation)

## 2. Environments

Each project has one or more environments. Environments are ordered for promotion workflows.

**Fields:**
- Name (e.g., `staging`, `production`)
- Trellis namespace (auto-generated: `{project-slug}-{env-name}`)
- Promotion order (numeric — lower promotes to higher)
- Environment-specific overrides: default replica count, resource tier, environment variables
- Locked flag (prevents deployments without admin approval)

**Behavior:**
- Default environments on project creation: `staging` and `production`
- Promotion: takes the exact image tag deployed in source environment and deploys it to the target
- Environment variables are scoped per-environment and stored as Trellis secrets under the hood
- Lock an environment (e.g., production during a freeze) to require admin approval for deployments

## 3. Services

A service is Bower's primary abstraction over Trellis jobs.

### Service types

| Type       | Maps to                                                              | Defaults                                        |
| ---------- | -------------------------------------------------------------------- | ----------------------------------------------- |
| **Web**    | Host-networked job with HTTP health, rolling updates, route-eligible | Port 8080, `/health`, rolling, 2 replicas       |
| **Worker** | No networking, restart policy, no health check or script-based       | Restart 3/5m, 1 replica                         |
| **Cron**   | Periodic execution (needs Trellis support; Bower manages start/stop as noop until then) | Schedule expression               |
| **Custom** | Full control over task groups, networking, etc. (escape hatch)       | None — user provides raw config                 |

### Service configuration (common fields)

- Name
- Image (registry/repo:tag or @digest)
- Resource tier: `small` (100m CPU, 128MiB), `medium` (250m, 256MiB), `large` (500m, 512MiB), `xl` (1000m, 1GiB), or custom
- Replica count (per-environment overrideable)
- Environment variables (plaintext, per-environment)
- Secrets (references to environment-scoped secrets)
- Volumes (scratch or host-volume by name)
- Deployment strategy: `rolling` (default), `recreate`, `blue-green`, `canary`
- Health check config (auto-populated from type defaults, customizable)
- Port (for web services)
- Command override (optional entrypoint/args)
- Labels (passed through to Trellis task group labels)

### How it maps to Trellis

Bower generates a complete `JobSpec` from the service configuration. The job name follows the pattern `{service-slug}` within the environment's namespace. When the user edits a service or triggers a deployment, Bower:

1. Generates the new `JobSpec`
2. Calls `POST /v1/jobs/plan` for the semantic diff
3. Shows the plan to the user
4. Calls `POST /v1/jobs` to apply
5. Records the deployment in its own history

### Sidecars

A service can have attached sidecars — additional containers in the same task group. The UI presents these as "add a sidecar" rather than exposing the task group concept.

## 4. Routes (managed ingress)

**Fields:**
- Domain (e.g., `api.example.com`)
- Path prefix (default `/`)
- Target service + port
- TLS mode: `auto` (Caddy automatic HTTPS), `custom` (user-provided cert via secret), `none`
- Headers (custom request/response headers)
- Rate limiting (requests/second, optional)
- Redirect rules (optional)

**How it works:**

Bower deploys and manages a reverse proxy job per namespace (one Caddy instance per environment). This proxy job:
- Uses `api_access: namespace/read` to discover healthy allocations via labels
- Runs a sync agent to watch allocation endpoints
- Renders upstream config and reloads the proxy
- Binds to a configurable host port (e.g., 80/443)

When a route is added/changed, Bower updates the proxy configuration and triggers a config reload. The proxy job itself is a Bower-managed Trellis job that users don't directly interact with — it appears in the UI as infrastructure rather than a user service.

**DNS:**
Bower tells the user what DNS record to create (e.g., "Point `api.example.com` CNAME to `node-1.cluster.example.com`"). It does not manage DNS.

## 5. Deployments

A deployment is an auditable event representing a change to a service in an environment.

**Fields:**
- Service, environment
- Image tag/digest (before and after)
- Strategy used
- Triggered by (user, webhook, promotion, rollback, auto-rollback)
- Status: `pending`, `planning`, `deploying`, `healthy`, `failed`, `rolled-back`
- Started/completed timestamps
- Trellis revision number
- Plan diff (stored)

### Deployment strategies implemented by Bower

| Strategy      | Implementation                                                                                                                                                 |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Rolling**   | Uses Trellis's native `rolling` update strategy. Bower watches allocation health during rollout.                                                              |
| **Recreate**  | Uses Trellis's native `recreate`.                                                                                                                              |
| **Blue-green** | Bower creates a second job (`{service}-green`), waits for it to be healthy, switches the route, then deletes the old job. Full atomic traffic switch.        |
| **Canary**    | Bower creates a canary job (`{service}-canary`) with low replica count and a `trellis/weight` label. Gradually increases weight/replicas over configurable steps. Automatic rollback if health degrades. |

### Automatic rollback

If allocations remain unhealthy for longer than a configurable threshold (default: 5 minutes), Bower re-applies the previous known-good spec. Recorded as a `rolled-back` deployment.

### Promotion

Deploying a service to a higher environment takes the exact image and config from the source environment. Config differences between environments (replica count, secrets, env vars) are applied from the target environment's overrides.

## 6. Secrets Management

**UI operations:**
- Create, view metadata, update, delete secrets per environment
- "Shared" secrets: same logical name across environments with different values (e.g., `DATABASE_URL` in staging vs. production)
- Rotation workflow: update secret value, optionally trigger restart of consuming services
- Secret references in service config link to these

**Under the hood:**
All secrets are stored in Trellis via its namespace-scoped secrets API. Bower adds metadata in Postgres (which services reference which secrets, shared-secret groupings, rotation timestamps) but never stores secret values itself.

## 7. Operational Actions

| Action                    | Implementation                                                                                                          | Trellis support |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------- |
| **Restart service**       | Needs Trellis `restart` endpoint. Workaround: bump a `BOWER_RESTART_EPOCH` env var to force a new execution hash.      | Noop            |
| **Scale service**         | Re-submits the `JobSpec` with new `count`. If Trellis adds a scale endpoint, use that.                                  | Workaround      |
| **Rollback**              | Re-applies a previous deployment's stored `JobSpec`. If Trellis adds revision history, can also use that.               | Workaround      |
| **Pause / resume**        | Sets `count: 0`. Bower remembers the original count for resume.                                                        | Workaround      |
| **View logs**             | Proxies `GET /v1/allocations/{id}/logs` per task. UI shows logs per service with allocation selector.                   | Supported       |
| **View events**           | Proxies `GET /v1/allocations/{id}/events`. Shows lifecycle timeline per allocation.                                     | Supported       |
| **Exec into container**   | Needs Trellis `exec` endpoint.                                                                                          | Noop            |
| **Diagnose**              | Calls job status and surfaces unhealthy/failed allocations with reason/message. Equivalent to `trellisctl jobs diagnose`. | Supported      |
| **Stop individual alloc** | Needs Trellis allocation stop endpoint.                                                                                 | Noop            |

"Noop" means the UI element exists but shows a "not yet available" state or toast. "Workaround" means Bower implements it using existing Trellis API surface.

## 8. Authentication & Authorization

### Auth system
- Email/password registration + login with bcrypt-hashed passwords
- Session-based auth (httpOnly cookies)
- Optional TOTP 2FA
- API keys for automation (webhook receivers)

### RBAC model

| Role         | Scope        | Permissions                                                                                      |
| ------------ | ------------ | ------------------------------------------------------------------------------------------------ |
| **Owner**    | Organization | Everything. Manage teams, projects, cluster connection.                                          |
| **Admin**    | Project      | Manage services, environments, routes, secrets, team membership. Deploy to any environment.      |
| **Deployer** | Project      | Deploy to unlocked environments. View services, logs, events. Cannot change service config or secrets. |
| **Viewer**   | Project      | Read-only access to services, deployments, logs, events.                                         |

Teams are groups of users with a project-level role. A user can be on multiple teams with different roles across projects.

### Audit log
Every mutation (deployment, config change, secret rotation, team change, route change) is recorded with who, what, when, and the before/after state.

## 9. Webhook & CI/CD Integration

### Inbound webhooks
- Per-service webhook URL that triggers a deployment when called with an image tag
- Supports Docker Hub, GHCR, and generic registry webhook payloads
- Signature verification (HMAC)
- Configurable: deploy on any push, only on tag match (regex), or only on digest

### Outbound webhooks
- Configurable notification endpoints for deployment events
- Payload includes: service, environment, image, status, user, timestamp
- Supports Slack, Discord, and generic HTTP

## 10. Monitoring & Observability Dashboard

### Project overview
- All services across all environments with health status at a glance
- Color-coded: green (healthy), yellow (converging), red (degraded/failed)

### Service detail
- Current allocations with lifecycle + health (separate, per Trellis model)
- Resource usage (when Trellis metrics are available)
- Recent deployment history timeline
- Live logs viewer (per allocation, per task)
- Event timeline (lifecycle transitions)

### Deployment feed
- Chronological list of all deployments across the project
- Filterable by environment, service, user, status
- Each entry expandable to show the plan diff and allocation convergence timeline

### Cluster view (read-only)
- Node list with capacity, health, labels, host volumes
- Node utilization overview
- Draining status (drain/undrain available to org owners)

## 11. Service Templates

Pre-built templates for common patterns:

- **Static site**: Caddy/nginx serving a directory, single replica, health check on `/`
- **API service**: Web type, rolling updates, health check, route-ready
- **Background worker**: Worker type, restart policy, no networking
- **Database** (dev only): Postgres/MySQL/Redis with host volume, script health check, single replica, not-for-production warning
- **Proxy/load balancer**: Custom type with host networking, multiple ports

Templates are starting points — all fields are editable after creation. Organizations can create custom templates.

## 12. Trellis API Additions Needed

Features that Bower implements as noop until Trellis adds support:

### Required (workarounds exist but are hacky)
1. **Restart endpoint** — `POST /v1/jobs/{name}/restart`
2. **Revision history** — `GET /v1/jobs/{name}/revisions`

### Strongly desired (significant UX improvement)
3. **Scale endpoint** — `PATCH /v1/jobs/{name}/scale`
4. **Real-time events** — SSE on `/v1/events`
5. **Individual allocation stop** — `DELETE /v1/allocations/{id}`

### Future
6. **Exec into container** — `POST /v1/allocations/{id}/exec`
7. **Per-allocation resource metrics**
8. **Cron/periodic job support**
9. **Pause/resume as a first-class state**

## 13. Tech Stack

- **Frontend**: Next.js 15, React, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API routes
- **Database**: PostgreSQL (via Drizzle ORM)
- **Auth**: Custom with bcrypt + sessions + optional TOTP
- **Real-time**: SSE for deployment progress (polling until Trellis adds event streaming)
- **Proxy**: Caddy (managed as a Trellis job per namespace)

## 14. Database Schema (high-level entities)

**Auth/org layer:** `organizations`, `users`, `teams`, `team_memberships`, `api_keys`, `sessions`

**Workload model:** `projects`, `environments`, `services`, `service_configs` (versioned), `sidecars`

**Deployment history:** `deployments`, `deployment_events`

**Routing layer:** `routes`, `managed_proxies`

**Secret linkage:** `secrets_metadata`, `shared_secret_groups` (values stay in Trellis)

**Audit:** `audit_log`

**Integrations:** `webhook_endpoints` (inbound), `notification_channels` (outbound)

**Templates:** `service_templates`

## 15. Responsibility Boundary

| Concern                              | Owner                                        |
| ------------------------------------ | -------------------------------------------- |
| Project/team/environment metadata    | Bower                                       |
| Service to job manifest translation  | Bower                                       |
| Route/proxy lifecycle                | Bower (manages Trellis proxy jobs)          |
| Deployment history & audit           | Bower                                       |
| Access control & teams               | Bower                                       |
| Scheduling, placement, reconciliation | Trellis                                     |
| Allocation lifecycle & health        | Trellis                                      |
| Secrets encryption & delivery        | Trellis                                      |
| Namespace networking & discovery     | Trellis                                      |
| Node management & draining           | Trellis (exposed read-only + drain in Bower) |
