#!/bin/bash
set -euo pipefail

PORTAINER_DATA=${PORTAINER_DATA:-/tmp/portainer}
PORTAINER_PROJECT=${PORTAINER_PROJECT:-$(pwd)}
PORTAINER_FLAGS=${PORTAINER_FLAGS:-}

docker rm -f portainer

docker run -d \
  -p 8000:8000 \
  -p 9000:9000 \
  -p 9443:9443 \
  -v "$PORTAINER_PROJECT/dist:/app" \
  -v "$PORTAINER_DATA:/data" \
  -v /var/run/docker.sock:/var/run/docker.sock:z \
  -v /var/run/docker.sock:/var/run/alternative.sock:z \
  -v /tmp:/tmp \
  --name portainer \
  portainer/base \
  /app/portainer $PORTAINER_FLAGS
