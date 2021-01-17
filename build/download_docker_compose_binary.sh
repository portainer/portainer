#!/usr/bin/env bash

PLATFORM=$1
ARCH=$2
DOCKER_COMPOSE_VERSION=$3

if [ "${PLATFORM}" == 'linux' ] && [ "${ARCH}" == 'amd64' ]; then
  wget -O "dist/docker-compose" "https://github.com/portainer/docker-compose-linux-amd64-static-binary/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose"
  chmod +x "dist/docker-compose"
elif [ "${PLATFORM}" == 'mac' ]; then
  wget -O "dist/docker-compose" "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-Darwin-x86_64"
  chmod +x "dist/docker-compose"
fi

exit 0
