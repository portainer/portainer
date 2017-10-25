#!/usr/bin/env sh

if [ "$1" = "-h" ] ; then
  echo "Usage: $(basename $0) <platform>-<arch> [<ext>]"
  exit 1
fi

mkdir -pv dist
binary="portainer-$1$2"

docker run --rm -t \
  - v $(pwd)/api:/src \
  -e BUILD_GOOS=$(echo $1 | cut -d \- -f 1) -e BUILD_GOARCH=$(echo $1 | cut -d \- -f 2) \
  portainer/golang-builder:cross-platform /src/cmd/portainer

mv "api/cmd/portainer/$binary" dist/
#sha256sum "dist/$binary" > portainer-checksum.txt
