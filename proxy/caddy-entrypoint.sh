#!/bin/sh
set -eu
exec caddy run --config /run/trellis-secrets/BOWER_CADDYFILE --adapter caddyfile
