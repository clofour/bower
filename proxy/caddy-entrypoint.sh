#!/bin/sh
set -eu
exec caddy run --config /run/trellis-secrets/CANOPY_CADDYFILE --adapter caddyfile
