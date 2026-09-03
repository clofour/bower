# CI/CD automation

## Deploy API

Trigger a deployment from any CI system using an API key created under **Account → API keys**.

```bash
curl -X POST https://canopy.example.com/api/deploy \
  -H "Authorization: Bearer <api-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "<service-id>",
    "environmentId": "<environment-id>",
    "image": "ghcr.io/org/app:v1.2.3"
  }'
```

`serviceId` and `environmentId` are UUIDs visible in the Canopy UI under each service and environment.

## Registry webhooks

Create an inbound endpoint under **Project → Integrations**. The endpoint token doubles as the HMAC-SHA256 signing secret.

Canopy accepts the signature in either of these headers:

- `X-Canopy-Signature`
- `X-Hub-Signature-256` (GitHub-compatible format)

Supported payload formats: Docker Hub, GHCR, and generic (any POST body containing an `image` field).

### Filtering

Each endpoint can be configured to deploy on:

- Any push to the linked repository
- Only tags matching a regex (e.g. `^v\d+\.\d+\.\d+$`)
- Only a specific image digest

### Outbound notifications

Configure outbound webhooks under **Project → Notification channels** to receive deployment events. Supported targets: Slack, Discord, and generic HTTP. The payload includes service, environment, image, status, triggered-by, and timestamp.
