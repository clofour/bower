# Bower UI surface map

This document defines the information architecture for the rebuilt Bower interface. It was produced from Bower's product model, database schema, server actions, and Trellis client surface—not from the previous UI implementation.

The previous UI source was treated as opaque. Existing page/component contents were not inspected; old UI-only files are removed or replaced wholesale in the redesign.

## Design intent

Bower is an opinionated application platform on top of Trellis. The interface should make the application model primary while preserving access to the Trellis state needed to understand failures and operate workloads.

The visual system is deliberately Bower-specific: a cool porcelain canvas, deep forest navigation, restrained teal accent, compact operational typography, and low-noise surfaces. The supplied Orchard screenshot informed only the desired level of cleanliness. Its structure, colors, components, borders, and design system were not used.

Authentication uses a separate visual motif: animated deployment/topology traces and pulsing nodes. The composition is a centered single-column stack rather than the reference image's split layout. Motion is disabled by the user's reduced-motion preference.

## Global navigation and identity

**Data**
- Current user name/email
- Organization name
- Organization role
- Current location

**Actions**
- Navigate between overview, projects, cluster, and settings
- Sign out

**States**
- Active navigation item
- Responsive horizontal navigation on narrow screens

## Authentication

**Login data/actions**
- Email
- Password
- Submit / validation errors
- Link to token-gated registration

**Registration data/actions**
- Name
- Email
- Password
- Single-use instance or organization invite token
- Submit / validation errors
- Link back to login

**Other**
- Animated topology background
- Clear explanation of what Bower is
- Reduced-motion fallback

## Workspace overview

**Data**
- Accessible projects
- Total service count
- Trellis node health/count when available
- Deployments currently pending/planning/deploying
- Recent deployments across projects
- Per-project service/environment counts
- Latest project deployment state

**Actions**
- Create project
- Open project
- Open deployment history
- Open full projects list

**States**
- Empty organization
- Trellis unavailable
- No deployment history

## Projects

**Data**
- Name, slug, description
- Owning team
- Registry URL
- Service count
- Environment list
- Updated timestamp

**Actions**
- Create project
- Open project

**Creation**
- Name
- Description
- Owning team
- Registry URL
- Explain that staging and production are created automatically

## Project-level navigation

Every project exposes:
- Overview
- Deployments
- Environments
- Routes
- Secrets
- Integrations
- Settings

Project role (admin, deployer, viewer) is visible in context and controls mutation affordances.

## Project overview

**Data**
- Service count
- Environment count
- Healthy/current allocation count from Trellis
- Route count
- Managed proxy count/status
- Services with per-environment live state
- Latest deployment activity

**Actions**
- Create service
- Open service
- Open deployment feed

**Service creation**
- Name
- Type: Web / Worker / Cron / Custom
- Image
- Optional organization/built-in template defaults

**States**
- Healthy
- Converging
- Degraded
- Not running / not yet deployed
- Empty project

## Service detail

This is the main operational surface.

**Service data**
- Name, type
- Routes
- Number of live allocations
- Per-environment configuration
- Latest deployment per environment
- Trellis job name/namespace

**Per-environment configuration**
- Image
- Port
- Replica count
- Resource tier
- CPU and memory
- Deployment strategy
- Health-check type/path/command/interval/timeout/threshold
- Auto-rollback threshold
- Command override
- Cron schedule
- Environment variables
- Labels
- Secret bindings
- Volumes
- Canary steps
- Raw custom JobSpec
- Sidecars

**Per-environment actions**
- Deploy
- Restart
- Scale
- Pause
- Resume
- Roll back when a previous spec exists
- Promote to the next ordered environment
- Save configuration

**Sidecar actions**
- Add
- Remove

**Allocation data**
- ID
- Lifecycle phase
- Independent health state
- Node
- Attempt
- Generation

**Allocation actions**
- Inspect
- Stop

**Service-level actions**
- View Trellis revisions
- Open managed route
- Delete service

**Access**
- Viewer: read only
- Deployer: operational actions
- Admin: operational actions + configuration and deletion

**Special state**
- Cron service warns that periodic execution depends on Trellis support while preserving the configured schedule.

## Allocation detail

**Identity and state**
- Allocation ID
- Job / group / namespace
- Lifecycle phase
- Health
- Node
- Address
- Generation
- Job revision
- Attempt
- Creation / transition timestamps
- Pending/failure reason and message
- Next retry time
- Draining state
- Port mappings
- Labels

**Diagnostics**
- Lifecycle event timeline
- Per-task resource samples
- Per-task logs
- Task list

**Actions**
- Stop allocation
- Execute a command in a task (non-viewers)

**States**
- Missing metrics
- Missing events
- Missing logs/task-group resolution
- Failed/degraded diagnostic callout

## Trellis job revisions

**Data**
- Environment
- Namespace/job identity
- Revision number
- Creation timestamp
- Complete stored JobSpec

**States**
- No revision history
- Connected Trellis version does not expose history

## Deployments

**Data**
- Service
- Environment
- Before/after image
- Strategy
- Trigger type / triggering user
- Status
- Trellis revision
- Started/completed timestamps
- Stored plan diff
- Deployment event timeline

**Actions**
- Refresh reconciliation/status
- Filter by service, environment, status
- Expand individual deployment

**Statuses**
- Pending
- Planning
- Deploying
- Healthy
- Failed
- Rolled back

## Environments

**Data**
- Name
- Trellis namespace
- Promotion order
- Locked state
- Default replicas
- Resource tier
- Secret-backed environment-variable keys
- Updated timestamp

**Actions**
- Create
- Edit defaults
- Update environment variables without reading existing values
- Lock / unlock
- Delete after services are removed

**Other**
- Explain promotion ordering
- Explain that environment-variable values remain in Trellis

## Routes / managed ingress

**Route data**
- Domain
- Path prefix
- Service target
- Environment
- Port
- TLS mode
- Custom TLS secret names
- Request headers
- Response headers
- Rate limit
- Redirect rules

**Managed proxy data**
- Environment
- Trellis proxy job name
- Proxy status
- Host port

**Actions**
- Create route
- Edit route
- Delete route
- Open public route

**Other**
- Bower manages proxy configuration, not DNS
- Custom TLS secret references are validated against the environment

## Secrets

**Data**
- Secret name
- Environment
- Trellis secret name
- Shared logical group
- Last rotation time

**Actions**
- Create
- Rotate by writing an existing name
- Delete if unused

**Security behavior**
- Values are never displayed or stored by Bower
- Deletion is blocked while service bindings or custom-TLS routes reference the secret

## Integrations

### Inbound deploy hooks

**Data**
- Service/environment target
- Provider: generic / GHCR / Docker Hub
- Deploy mode: any push / tag / digest
- Tag filter
- Token prefix
- Active state
- Creation time

**Actions**
- Create
- Delete
- Reveal the full endpoint token/HMAC secret exactly once at creation

### Outbound notifications

**Data**
- Name
- Type: Slack / Discord / generic HTTP
- Active state
- Creation time

**Actions**
- Create HTTPS destination
- Delete destination

## Cluster

**Summary**
- Node count / healthy nodes
- Allocation count / running allocations
- CPU utilization
- Memory utilization

**Per-node data**
- ID
- Host/address
- Healthy/unhealthy/draining status
- CPU capacity/usage
- Memory capacity/usage
- OS/architecture
- Trellis version
- Last heartbeat
- Allocation count
- Labels
- Host volumes

**Actions**
- Owner-only drain / undrain

**States**
- Trellis unavailable
- No registered nodes

## Account settings

**Profile**
- Name
- Email
- Save

**Password**
- Current password
- New password
- Change password

**API keys**
- Name
- Prefix
- Created time
- Last-used time
- Create
- Reveal full key once
- Revoke

## Organization settings

**Data**
- Organization name
- Trellis API URL
- Organization members and roles
- Invite-token prefixes/status/notes/timestamps

**Actions**
- Update organization name / Trellis URL
- Replace Trellis operator credential without redisplaying it
- Owner: add/change registered member role
- Admin/owner: create invite token
- Reveal invite token once
- Revoke unused invite token

## Teams and RBAC

**Team data**
- Name
- Members
- Project grants

**Actions**
- Create/delete team
- Add/remove organization members
- Grant/revoke project access
- Set grant role: admin / deployer / viewer

## Audit log

**Data**
- Action
- Resource type/id
- Actor
- Timestamp
- Structured details including before/after data where recorded

**Actions**
- Expand an audit entry to inspect details

## Service templates

**Data**
- Name
- Description
- Service type
- Built-in vs organization-owned
- Template JSON
- Creation time

**Actions**
- Create organization template
- Delete organization template
- Built-ins are read-only

**Creation fields**
- Name
- Description
- Type
- Image
- Port
- Replicas
- Additional JSON defaults

## Permission presentation

The UI suppresses mutation controls that the backend would reject:
- Organization owner: all organization controls, including node draining and member roles
- Organization admin: organization/project administration except owner-only actions
- Organization member: project access comes through teams
- Project admin: configuration + deployment operations
- Project deployer: deployment/operational actions, no configuration
- Project viewer: read-only status, logs, events, and history

Backend authorization remains authoritative.

## Empty, loading, failure, and destructive states

Every major collection has an explicit empty state rather than a blank surface. Trellis-dependent pages degrade to an unavailable/no-data state instead of pretending the cluster is healthy. Destructive controls use the danger visual language and are hidden or disabled when Bower's own preconditions make them invalid.

## Accessibility and motion

- Native semantic forms, buttons, tables, links, details/summary, headings, and labels
- Keyboard-visible focus ring
- Status is expressed with text as well as color
- Responsive navigation and grids
- Auth animation has a reduced-motion fallback
- No essential information is conveyed only through animation
