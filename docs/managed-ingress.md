# Managed ingress

Bower manages a reverse proxy per Trellis namespace, so services can be exposed via HTTP/HTTPS routes without manually authoring proxy jobs.

## How it works

When a route is created or updated, Bower:

1. Generates a Caddyfile for the route configuration and writes it as a Trellis namespace secret
2. Deploys (or updates) a two-task task group in the namespace: a Caddy instance and a route-sync agent
3. The sync agent uses `api_access: namespace/read` to watch healthy allocations via labels, renders upstream addresses, and reloads Caddy through its admin API whenever allocations change

The proxy job is managed infrastructure — it appears in the Bower UI but is not shown as a user service.

## TLS

| Mode | Behaviour |
|---|---|
| `auto` | Caddy obtains and renews certificates automatically via ACME |
| `custom` | Caddy reads a certificate and key from a Trellis secret you provide |
| `none` | HTTP only |

## DNS

Bower tells you what DNS record to create (e.g. "Point `api.example.com` CNAME to `node-1.cluster.example.com`"). It does not manage DNS records itself.

## Canary weight

The sync agent reads the `trellis/weight` label on allocations and passes the value to Caddy as an upstream weight. This is how canary deployments shift traffic gradually — no manual proxy config required.

## Overriding proxy images

The proxy images are published alongside Bower releases. Override them when pulling from a private registry:

```bash
BOWER_CADDY_IMAGE=registry.example.com/bower-caddy:latest
BOWER_PROXY_SYNC_IMAGE=registry.example.com/bower-proxy-sync:latest
```

The source for both images is under `proxy/` in this repository.

## Host ports

The proxy binds to host ports 80 and 443 by default. Change them with:

```bash
BOWER_PROXY_HTTP_PORT=8080
BOWER_PROXY_HTTPS_PORT=8443
```
