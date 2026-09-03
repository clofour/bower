// ---------------------------------------------------------------------------
// Trellis API — TypeScript type definitions
// ---------------------------------------------------------------------------

// -- Auth -------------------------------------------------------------------

export interface TrellisWhoAmI {
  kind: string
  scope: 'cluster' | 'namespace'
  access: 'read' | 'write'
  namespace: string | null
  created_at: string // ISO 8601
}

// -- Nodes ------------------------------------------------------------------

export interface TrellisNode {
  id: string
  address: string
  status: 'healthy' | 'unhealthy' | 'draining'
  cpu: number // millicores capacity
  memory: number // bytes capacity
  cpu_used: number
  memory_used: number
  os: string
  arch: string
  labels: Record<string, string>
  host_volumes: string[]
  version: string
  last_heartbeat: string // ISO 8601
}

// -- Constraints ------------------------------------------------------------

export interface TrellisConstraint {
  attribute: string
  operator: '=' | '!=' | 'in' | 'not_in' | 'exists' | 'not_exists'
  value?: string
  values?: string[]
}

// -- Volumes ----------------------------------------------------------------

export interface TrellisVolume {
  name: string
  type: 'host' | 'ephemeral'
  source?: string // host path (for host volumes)
  destination: string // mount path inside the container
  read_only?: boolean
}

// -- Secret references (within a task spec) ---------------------------------

export interface TrellisSecretRef {
  name: string
  target: 'env' | 'file'
  env?: string // environment variable name when target = 'env'
  path?: string // file path when target = 'file'
}

// -- Health checks ----------------------------------------------------------

export interface TrellisHealthCheck {
  type: 'http' | 'tcp' | 'script'
  path?: string // HTTP path (for http checks)
  port?: number // port to check (http / tcp)
  command?: string // command to run (script checks)
  interval: number // nanoseconds
  timeout: number // nanoseconds
  initial_delay?: number // nanoseconds
  success_threshold?: number
  failure_threshold?: number
}

// -- Tasks ------------------------------------------------------------------

export interface TrellisTask {
  name: string
  image: string
  command?: string
  env?: Record<string, string>
  networking?: TrellisNetworking
  resources?: TrellisResources
  volumes?: TrellisVolume[]
  secrets?: TrellisSecretRef[]
  health_check?: TrellisHealthCheck
}

export interface TrellisNetworking {
  mode?: 'isolated' | 'host' | 'namespace'
  ports?: TrellisPort[]
}

export interface TrellisPort {
  port: number
}

export interface TrellisResources {
  cpu?: number // millicores
  memory?: number // bytes
}

// -- Task groups ------------------------------------------------------------

export interface TrellisRestartPolicy {
  max_restarts: number
  window: number // nanoseconds
}

export interface TrellisUpdateStrategy {
  strategy: 'recreate' | 'rolling'
  max_parallel?: number
}

export interface TrellisApiAccess {
  scope: 'namespace' | 'cluster'
  access: 'read' | 'write'
}

export interface TrellisTaskGroup {
  name: string
  count: number
  runtime?: string
  labels?: Record<string, string>
  constraints?: TrellisConstraint[]
  api_access?: TrellisApiAccess
  restart?: TrellisRestartPolicy
  update?: TrellisUpdateStrategy
  tasks: TrellisTask[]
}

// -- Job spec (the payload submitted to POST /v1/jobs) ----------------------

export interface TrellisJobSpec {
  name: string
  namespace: string
  task_groups: TrellisTaskGroup[]
}

// -- Allocations ------------------------------------------------------------

export type TrellisAllocationStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'lost'

export type TrellisHealthStatus = 'healthy' | 'unhealthy' | 'pending' | 'none'

export interface TrellisAllocationPort {
  label: string
  port: number
  host_port: number
}

export interface TrellisAllocation {
  id: string
  job_name: string
  task_group: string
  namespace: string
  node_id: string
  node_address: string
  status: TrellisAllocationStatus
  health: TrellisHealthStatus
  created_at: string // ISO 8601
  updated_at: string // ISO 8601
  ports: TrellisAllocationPort[]
  labels: Record<string, string>
  events: TrellisEvent[]
}

// -- Events -----------------------------------------------------------------

export interface TrellisEvent {
  type: string
  message: string
  timestamp: string // ISO 8601
  details?: Record<string, string>
}

// -- Jobs (full response from GET /v1/jobs/{name}) --------------------------

export type TrellisJobStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'dead'

export interface TrellisJob {
  name: string
  namespace: string
  status: TrellisJobStatus
  revision: number
  spec: TrellisJobSpec
  allocations: TrellisAllocation[]
  created_at: string // ISO 8601
  updated_at: string // ISO 8601
}

// -- Plan (response from POST /v1/jobs/plan) --------------------------------

export interface TrellisPlanDiff {
  type: 'added' | 'removed' | 'modified' | 'unchanged'
  field: string
  old_value?: unknown
  new_value?: unknown
}

export interface TrellisPlan {
  job_name: string
  namespace: string
  diff: TrellisPlanDiff[]
  annotations: string[]
  created: boolean
  warnings: string[]
}

// -- Secrets (metadata only) ------------------------------------------------

export interface TrellisSecret {
  name: string
  namespace: string
  version: number
  created_at: string // ISO 8601
  updated_at: string // ISO 8601
}

// -- Request payloads -------------------------------------------------------

export interface TrellisSetSecretRequest {
  value_base64: string
  expected_version?: number
}

export interface TrellisApplyJobRequest {
  spec: TrellisJobSpec
}

export interface TrellisPlanJobRequest {
  spec: TrellisJobSpec
}

// -- API response wrappers (for apply) --------------------------------------

export interface TrellisApplyJobResponse {
  created: boolean
  revision?: number
}
