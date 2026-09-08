#!/bin/sh
if [ -n "$TRELLIS_CA_CERT" ]; then
  printf '%s\n' "$TRELLIS_CA_CERT" > /tmp/trellis-ca.pem
  export NODE_EXTRA_CA_CERTS=/tmp/trellis-ca.pem
else
  export NODE_TLS_REJECT_UNAUTHORIZED=0
fi
exec node server.js
