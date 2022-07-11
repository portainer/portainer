#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 3 ]]; then
    echo "Illegal number of parameters" >&2
    exit 1
fi

PLATFORM=$1
ARCH=$2
COMPOSE_VERSION=$3


if [[ ${ARCH} == "amd64" ]]; then
    ARCH="x86_64"
elif [[ ${ARCH} == "arm" ]]; then
    ARCH="armv7"
elif [[ ${ARCH} == "arm64" ]]; then
    ARCH="aarch64"
fi


if [[ "$PLATFORM" == "windows" ]]; then
    wget -O "dist/docker-compose.exe" "https://github.com/docker/compose/releases/download/$COMPOSE_VERSION/docker-compose-windows-${ARCH}.exe"
    chmod +x "dist/docker-compose.exe"
else
    wget -O "dist/docker-compose" "https://github.com/docker/compose/releases/download/$COMPOSE_VERSION/docker-compose-${PLATFORM}-${ARCH}"
    chmod +x "dist/docker-compose"
fi

