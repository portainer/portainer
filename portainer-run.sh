#!/bin/bash

PROJECT_ROOT=$(git rev-parse --show-toplevel)
DIST=$PROJECT_ROOT/dist
PORTAINER=$DIST/portainer
DATA=/home/ali/portainer/drives/ce
ASSETS=$DIST

# build
cd "$PROJECT_ROOT"/api || exit
go build -o "$DIST"/portainer cmd/portainer/*.go

# compose
cd "$PROJECT_ROOT"
PLATFORM=`go env GOOS`
ARCH=`go env GOARCH`
./build/download_docker_compose_binary.sh $PLATFORM $ARCH v2.5.1

# run
$PORTAINER --data=$DATA --assets="$ASSETS"
