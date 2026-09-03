import test from 'node:test'
import assert from 'node:assert/strict'
import { buildJobSpec, type CanopyServiceConfig } from './job-builder'

const base: CanopyServiceConfig = {
  name: 'api-green', serviceLabel: 'api', namespace: 'shop-production', type: 'web', image: 'ghcr.io/acme/api:v2',
  port: 8080, replicas: 2, cpu: 250, memory: 268435456, healthCheckType: 'http', healthCheckPath: '/ready',
  healthCheckInterval: 7, healthCheckTimeout: 3, healthCheckThreshold: 4, deploymentStrategy: 'rolling',
  envVars: { LOG_LEVEL: 'info' }, labels: { team: 'platform' }, command: '/app/server',
  secrets: [{ name: 'DATABASE_URL', target: 'env', env: 'DATABASE_URL' }],
  volumes: [{ name: 'cache', path: '/cache' }],
  sidecars: [{ name: 'otel', image: 'otel/opentelemetry-collector:latest', cpu: 100, memory: 67108864, envVars: {} }],
}

test('builds a complete web workload with platform labels and attachments', () => {
  const spec = buildJobSpec(base); const group = spec.task_groups[0]; const primary = group.tasks[0]
  assert.equal(spec.name, 'api-green'); assert.equal(group.count, 2); assert.equal(group.labels?.['canopy/service'], 'api')
  assert.equal(primary.health_check?.interval, 7_000_000_000); assert.equal(primary.secrets?.[0].env, 'DATABASE_URL')
  assert.equal(primary.volumes?.[0].path, '/cache'); assert.equal(group.tasks[1].name, 'otel')
})

test('custom raw specs keep the selected Canopy name and namespace', () => {
  const raw = { name: 'ignored', namespace: 'ignored', task_groups: [{ name: 'custom', count: 1, tasks: [{ name: 'task', image: 'busybox' }] }] }
  const spec = buildJobSpec({ ...base, type: 'custom', rawConfig: raw })
  assert.equal(spec.name, base.name); assert.equal(spec.namespace, base.namespace); assert.equal(spec.task_groups[0].tasks[0].image, 'busybox'); assert.equal(spec.task_groups[0].labels?.['canopy/service'], 'api')
})
