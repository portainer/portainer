#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

PLATFORM=$1
ARCH=$2
DOCKER_COMPOSE_VERSION=$3

function download_binary() {
    local PLATFORM=$1
    local ARCH=$2
    local BINARY_VERSION=$3
    
    if [ "${PLATFORM}" == 'linux' ] && [ "${ARCH}" == 'amd64' ]; then
        wget -O "dist/docker-compose" "https://github.com/portainer/docker-compose-linux-amd64-static-binary/releases/download/${BINARY_VERSION}/docker-compose"
        chmod +x "dist/docker-compose"
        return
    fi
    
    if [ "${PLATFORM}" == 'mac' ]; then
        wget -O "dist/docker-compose" "https://github.com/docker/compose/releases/download/${BINARY_VERSION}/docker-compose-Darwin-x86_64"
        chmod +x "dist/docker-compose"
        return
    fi
    
    if [ "${PLATFORM}" == 'win' ]; then
        wget -O "dist/docker-compose.exe" "https://github.com/docker/compose/releases/download/${BINARY_VERSION}/docker-compose-Windows-x86_64.exe"
        chmod +x "dist/docker-compose.exe"
        return
    fi
}

function download_plugin() {
    local PLATFORM=$1
    local ARCH=$2
    local PLUGIN_VERSION=$3
    
    if [ "${PLATFORM}" == 'mac' ]; then
        PLATFORM="darwin"
    fi
    
    FILENAME="docker-compose-${PLATFORM}-${ARCH}"
    TARGET_FILENAME="docker-compose.plugin"
    if [[ "$PLATFORM" == "windows" ]]; then
        FILENAME="$FILENAME.exe"
        TARGET_FILENAME="$TARGET_FILENAME.exe"
    fi
    
    wget -O "dist/$TARGET_FILENAME" "https://github.com/docker/compose-cli/releases/download/v$PLUGIN_VERSION/$FILENAME"
    chmod +x "dist/$TARGET_FILENAME"
}

if [ "${PLATFORM}" == 'linux' ] && [ "${ARCH}" != 'amd64' ]; then
    download_plugin "$PLATFORM" "$ARCH" "$DOCKER_COMPOSE_VERSION"
fi

download_binary "$PLATFORM" "$ARCH" "$DOCKER_COMPOSE_VERSION"