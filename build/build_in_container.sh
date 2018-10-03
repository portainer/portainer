#!/usr/bin/env sh

binary="portainer-$1-$2"

mkdir -p dist

docker run --rm -tv "$(pwd)/api:/src" -e BUILD_GOOS="$1" -e BUILD_GOARCH="$2" portainer/golang-builder:cross-platform /src/cmd/portainer

mv "api/cmd/portainer/$binary" dist/
#sha256sum "dist/$binary" > portainer-checksum.txt
