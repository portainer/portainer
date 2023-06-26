#!/usr/bin/env bash
set -euo pipefail

PLATFORM=$(go env GOOS)
ARCH=$(go env GOARCH)
COMPOSE_VERSION=v2.5.1


if [[ ${ARCH} == "amd64" ]]; then
    ARCH="x86_64"
elif [[ ${ARCH} == "arm" ]]; then
    ARCH="armv7"
elif [[ ${ARCH} == "arm64" ]]; then
    ARCH="aarch64"
fi


if [[ "$PLATFORM" == "windows" ]]; then
    wget -O "docker-compose.exe" "https://github.com/docker/compose/releases/download/$COMPOSE_VERSION/docker-compose-windows-${ARCH}.exe"
    chmod +x "docker-compose.exe"
else
    wget -O "docker-compose" "https://github.com/docker/compose/releases/download/$COMPOSE_VERSION/docker-compose-${PLATFORM}-${ARCH}"
    chmod +x "docker-compose"
fi

