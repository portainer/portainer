#!/bin/sh

# Dependencies: cat, docker, dos2unix

buildscripts="$(realpath $(dirname $0))"

exitcode() {
  if [ "$1" -ne "0" ]; then
    echo "$2! $1"
    exit "$1"
  fi
}

echo ""
echo "[FACTORY] Building portainer/builder..."

mkdir -pv tmp && cd tmp

echo 'FROM golang:alpine' > Dockerfile
echo 'RUN echo "http://dl-cdn.alpinelinux.org/alpine/edge/community" >> /etc/apk/repositories' \
      '&& apk add -U --no-cache git upx' >> Dockerfile

docker build -t portainer/builder .
exitcode "$?" "Building portainer/builder failed"

cd .. && rm -rf tmp

echo ""
echo "[FACTORY] Getting golang dependencies..."

if [ -d "godeps" ]; then rm -rf godeps; fi
mkdir -vp godeps
dos2unix "$buildscripts"/builder.sh;
docker run --rm -t \
           -w //src \
           -v "/$(dirname $buildscripts)"/api:/src \
           -v "/$(dirname $buildscripts)"/godeps:/godeps \
           portainer/builder sh -c "mainPath=//src mainPackagePath=/cmd/portainer; DEPSONLY=true `cat $buildscripts/builder.sh`"
exitcode "$?" "Getting dependencies failed"

echo ""
echo "[FACTORY] Building portainer/factory..."

if [ -d "tmp" ]; then rm -rf tmp; fi
mkdir -pv tmp && cd tmp

cp "$buildscripts/Dockerfile" ./ && dos2unix Dockerfile
cp "$(dirname "$buildscripts")/package.json" ./
cp "$(dirname "$buildscripts")/bower.json" ./

mv "$(dirname $buildscripts)/godeps/portainer-godeps.tar" ./

docker build -t portainer/factory --no-cache --squash .
exitcode "$?" "Building portainer/factory failed"

cd .. && rm -rf tmp

echo ""
echo "[FACTORY] Cleaning dangling images..."

docker rmi $(docker images -q -f dangling=true)
