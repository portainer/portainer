#!/usr/bin/env sh

if [ "$1" = "-h" ] ; then
  echo "Usage: $(basename $0) <platform>-<arch> [<ext>]"
  exit 1
fi

mkdir -pv dist
binary="portainer-$1$2"
container="builder-$1";
mainPath="/src/api"
mainPackagePath="cmd/portainer"

if [ -z "$(docker container inspect "$container" 2>&1 | grep "Error:")" ]; then docker container rm -f "$container"; fi

docker run --name "$container" -t \
  -v portainer-src-volume:/src \
  -w /src \
  -e BUILD_GOOS=$(echo $1 | cut -d \- -f 1) -e BUILD_GOARCH=$(echo $1 | cut -d \- -f 2) \
  portainer/builder sh -c "mainPath=$mainPath mainPackagePath=$mainPackagePath COMPRESS_BINARY=true `cat $(dirname $0)/builder.sh`"

rc=$?

docker cp "$container":"${mainPath}/${mainPackagePath}/$binary" dist/
#sha256sum "dist/$binary" > portainer-checksum.txt
#echo "checksum: `cat portainer-checksum.txt` "
docker rm -f "$container"

if [ $rc -ne 0 ]; then exit $rc; fi
