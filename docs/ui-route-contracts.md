# UI route contract inventory

This inventory was completed before the September 2026 interface replacement. The redesign changes presentation and client interaction only; authorization remains enforced by the server query/action layer.

## Shared boundaries

- Dashboard server components call `getCurrentUser` and `getUserOrganization` and redirect unauthenticated or unassigned users to `/login`.
- Project routes resolve the organization-scoped project with `getProjectBySlug`; missing projects and services call `notFound()`.
- Role visibility is supplied by `getUserOrganization`, while mutations continue through `requireContext`, `requireProject`, and `requireService`. UI visibility is not an authorization boundary.
- Dynamic route parameters are promises in Next.js 16.3.4 and are awaited before querying.
- Client components are limited to interactive forms, dialogs, polling, disclosures, and optimistic/pending feedback. Data pages and layouts remain Server Components.

## Route and data contracts

| Route | Queries / context | Mutations and behavior |
| --- | --- | --- |
| `/login` | Client form, no initial query | `loginAction(FormData)`; reports `{ error }`, successful action redirects |
| `/register` | Client form; registration mode is interpreted by backend | `registerAction(FormData)` accepts name, email, password, invite/instance token; reports `{ error }`, successful action redirects |
| `/dashboard` | projects plus per-project services, environments, and recent deployments | Read-only overview; redirects without authenticated organization context |
| `/projects` | role-filtered projects | `createProjectAction`; organization admins may see wider scope |
| `/projects/[slug]` | project, services, environments, deployments | Project-scoped overview; `notFound()` on invalid slug |
| `/projects/[slug]/services/[serviceSlug]` | service configs/environments, deployments, sidecars and runtime allocation data | deploy, promote, rollback, scale, resume, restart, configuration, sidecars, delete; locked environments remain server-enforced |
| `/projects/[slug]/services/[serviceSlug]/revisions` | service deployment/revision history | rollback/deploy operations retain service action signatures |
| `/projects/[slug]/services/[serviceSlug]/allocations/[allocationId]` | Trellis allocation/job data | stop allocation and exec actions; connection failures remain visible |
| `/projects/[slug]/environments` | environments | create, update, lock/unlock, delete through `operations.ts` |
| `/projects/[slug]/deployments` | deployments and deployment events | polling refreshes active deployment statuses; operational payloads are disclosure content |
| `/projects/[slug]/routes` | routes and managed proxies | create, update, delete; route configuration and proxy runtime are separate data sets |
| `/projects/[slug]/secrets` | secret metadata only | set/rotate and delete; values are write-only and never rendered from persistence |
| `/projects/[slug]/integrations` | webhooks and notification channels | create/delete; webhook token is returned once in `WebhookCreationState` |
| `/cluster` | authenticated Trellis node listing | `setNodeDrainAction`; instance/organization role checks remain server-side |
| `/settings/organization` | organization, members, organization tokens | organization update, member invitation, token create/revoke according to role |
| `/settings/account` | current user and API keys | account/password updates and API-key create/revoke |
| `/settings/teams` | teams, members, project grants | create/delete team, membership and project-access mutations |
| `/settings/templates` | built-in and organization templates | custom template create/delete |
| `/settings/audit` | organization audit events | read-only filtering and detail disclosure |

## Preserved data vocabulary

The UI retains service type, image, environment, replicas, CPU/memory, ports, health checks, deployment strategy, resource tier, commands and schedules; deployment status, trigger, actor, timestamps, image transition, Trellis revision, plan diff and events; environment namespace/order/lock/defaults/variables; route host/path/destination/TLS/proxy/headers/redirect/rate limits; secret metadata and shared groups; integration provider/mode/tag/token prefix/activity; node readiness/drain/capacity/utilization; and organization/team/account/audit metadata. A field may be progressively disclosed, but it is not removed from backend contracts.

## Design audit (follow-up)

The first redesign pass did not satisfy the design direction in several places. This audit treats those as implementation defects rather than exceptions:

- **Hierarchy:** project cards, dashboard cards, icons, borders, and shadows had nearly equal visual weight. Collection and monitoring views now use quieter rows and reserve emphasis for active/failing operations.
- **Function over decoration:** global card shadows and ornamental empty-state icon treatments made every surface appear elevated. Base cards are now flat; overlays alone receive elevation.
- **Working controls:** the projects page shipped disabled “New project” controls despite a working action and dialog. Those placeholders were removed and the real creation flow is used.
- **Density by task:** cluster and deployment monitoring remain dense tables; authentication and destructive confirmations remain focused and spacious.
- **Progressive disclosure:** project navigation is grouped around the common workflow, with administrative and automation destinations separated from daily operations. Destructive node drain is confirmed instead of being a one-click table action.
- **Change over time:** loading shapes now describe the destination page rather than using one generic skeleton everywhere. Empty and failure messages identify the next useful action.
- **Accessible meaning:** status, lock, active navigation, validation, and pending states use text or symbols as well as color. Mobile navigation uses a native keyboard-operable disclosure, and current locations are announced independently of color.
- **Product identity:** the topology represents Bower coordinating workloads into Trellis rather than using generic constellation decoration. Accent color is kept out of success, warning, and failure communication.

The remaining product screens inherit the audited primitives. Backend role checks remain authoritative regardless of whether an action is presented in the interface.
