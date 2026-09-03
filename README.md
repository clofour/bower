# Canopy

Canopy is an opinionated deployment dashboard built on top of [Trellis](https://github.com/clofour/trellis-experimental). It turns Trellis jobs and namespaces into projects, environments, services, promotions, routes, secrets, deployment history, teams, and an audit trail while leaving scheduling and container lifecycle in Trellis.

## Run locally

Requirements: Node.js 20+, PostgreSQL, and a Trellis cluster credential with `cluster/write` access.

```bash
cp .env.example .env.local
npm install
npm run db:migrate
npm run dev
```

Open `http://localhost:3000`, create the first organization owner, then add the Trellis API URL and token under **Organization**.

## Commands

```bash
npm run dev
npm run lint
npm run build
npm run db:generate
npm run db:migrate
```

## Trellis support boundary

Canopy uses Trellis directly for job planning/application, allocation lifecycle and health, logs, lifecycle events, namespace secrets, and node draining. Scaling, pause/resume, promotion, and rollback are composed from job resubmission.

Controls that require APIs Trellis does not expose yet are intentionally present but no-op: restart, revision browsing, individual allocation stop, exec, cron execution, live event streaming, and per-allocation metrics. The UI explains this at the point of use instead of presenting a broken action.

See [PLAN.md](./PLAN.md) for the product model and responsibility boundary.
