#!/bin/bash
set -euo pipefail

PORTAINER_DATA=${PORTAINER_DATA:-/tmp/portainer}
PORTAINER_PROJECT=${PORTAINER_PROJECT:-$(pwd)}
PORTAINER_FLAGS=${PORTAINER_FLAGS:-}

sudo podman rm -f portainer

# rootful podman (sudo required)
sudo podman run -d \
  -p 8000:8000 \
  -p 9000:9000 \
  -p 9443:9443 \
  -v "$PORTAINER_PROJECT/dist:/app" \
  -v "$PORTAINER_DATA:/data" \
  -v /run/podman/podman.sock:/var/run/docker.sock \
  -v /tmp:/tmp \
  -e CSP=false \
  --privileged \
  --name portainer \
  portainer/base \
  /app/portainer $PORTAINER_FLAGS
