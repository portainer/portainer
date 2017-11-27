#!/usr/bin/env sh

set -e

if [ $# -ne 2 ] ; then
  echo "Usage: $(basename $0) <VERSION> 'linux-amd64 linux-386 linux-arm linux-arm64 linux-ppc64le darwin-amd64 windows-amd64'"
  exit 1
else
  docker login -u="$DOCKER_USER" -p="$DOCKER_PASS"
  for tag in $2; do
    if [ $tag = 'build-system' ]; then
      echo "[DEPLOY] Pushing portainer/factory..."
      #docker push "portainer/factory"
      docker tag "portainer/factory" "11384eb/portainer:factory"
      docker push "11384eb/portainer:factory"

      echo "[DEPLOY] Pushing portainer/builder..."
      #docker push "portainer/builder"
      docker tag "portainer/builder" "11384eb/portainer:builder"
      docker push "11384eb/portainer:builder"
    else
      echo "[DEPLOY] Pushing $tag[-$1]..."
      docker tag "portainer/portainer:$tag-$1" "11384eb/portainer:$tag-$1"
      docker push "11384eb/portainer:$tag-$1"
      #docker push "portainer/portainer:$tag-$1"
      #docker push "portainer/portainer:$tag"
    fi
  done
  docker logout
  exit 0
fi
