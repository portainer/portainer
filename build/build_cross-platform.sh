#!/usr/bin/env bash

binary="portainer-$1-$2"

docker run -tv $(pwd)/api:/src -e BUILD_GOOS="$1" -e BUILD_GOARCH="$2" portainer/golang-builder:cross-platform /src/cmd/portainer

mkdir -p dist
mv "api/cmd/portainer/$binary" dist/
shasum "dist/$binary" > portainer-checksum.txt
