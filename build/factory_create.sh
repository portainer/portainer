#!/bin/sh

# Dependencies: cat, docker, dos2unix

buildscripts="$(realpath $(dirname $0))"
c="$buildscripts/ansi_color.sh"; if [ -f "$c" ]; then . "$c"; fi

exitcode() {
  if [ "$1" -ne "0" ]; then
    echo "$2! $1"
    exit "$1"
  fi
}

printf "\n${ANSI_CYAN}[FACTORY] Building portainer/builder...${ANSI_NOCOLOR}\n"

mkdir -pv tmp && cd tmp

echo 'FROM golang:alpine' > Dockerfile
echo 'RUN echo "http://dl-cdn.alpinelinux.org/alpine/edge/community" >> /etc/apk/repositories' \
      '&& apk add -U --no-cache git upx' >> Dockerfile

docker build -t portainer/builder .
exitcode "$?" "Building portainer/builder failed"

cd .. && rm -rf tmp

printf "\n${ANSI_CYAN}[FACTORY] Getting dependencies...${ANSI_NOCOLOR}\n"
if [ -d "godeps" ]; then rm -rf godeps; fi
mkdir -vp godeps
dos2unix "$buildscripts"/builder.sh;
docker run --rm -t \
           -w //src \
           -v "/$(dirname $buildscripts)"/api:/src \
           -v "/$(dirname $buildscripts)"/godeps:/godeps \
           portainer/builder sh -c "mainPath=//src mainPackagePath=/cmd/portainer; DEPSONLY=true `cat $buildscripts/builder.sh`"
exitcode "$?" "Getting dependencies failed"

printf "\n${ANSI_CYAN}[FACTORY] Building portainer/factory...${ANSI_NOCOLOR}\n"

if [ -d "tmp" ]; then rm -rf tmp; fi
mkdir -pv tmp && cd tmp

cp "$buildscripts/Dockerfile" ./ && dos2unix Dockerfile
cp "$buildscripts/bootstrap.sh" ./
cp "$buildscripts/ansi_color.sh" ./
cp "$(dirname "$buildscripts")/package.json" ./

if [ "$(uname | grep "MINGW")" = "" ]; then group="$USER"; else group="None"; fi
`command -v sudo` chown -R $USER:$group "$(dirname $buildscripts)/godeps"
mv "$(dirname $buildscripts)/godeps/portainer-godeps.tar" ./

docker build -t portainer/factory --no-cache .
exitcode "$?" "Building portainer/factory failed"

cd .. && rm -rf tmp

printf "\n${ANSI_CYAN}[FACTORY] Downloading docker binaries...${ANSI_NOCOLOR}\n"

releases='linux:amd64 linux:arm linux:arm64 linux:ppc64le darwin:amd64 windows:amd64'
cmd="grunt"
for tag in $releases; do cmd="$cmd shell:downloadDockerBinary:$tag"; done

cd $(dirname "$buildscripts")

if [ -z "$(docker container inspect $1 2>&1 | grep "Error:")" ]; then
  docker rm -f "portainer-factory";
fi

docker run -t --rm \
           -v /$(pwd):/work \
           portainer/factory "$cmd" "mkdir -pv /work/docker-binaries" "cp -r //docker-binaries/* /work/docker-binaries"
exitcode "$?" "Downloading docker binaries failed"

printf "\n${ANSI_CYAN}[FACTORY] Adding docker binaries to portainer/factory...${ANSI_NOCOLOR}\n"

mkdir -pv tmp && cd tmp
`command -v sudo` chown -R $USER:$group ../docker-binaries
mv ../docker-binaries/ ./

echo "FROM portainer/factory" > Dockerfile
echo "ADD docker-binaries /docker-binaries" >> Dockerfile

docker build -t portainer/factory .
exitcode "$?" "Adding docker binaries to portainer/factory failed"

cd .. && rm -rf tmp

printf "\n${ANSI_MAGENTA}[FACTORY] Cleaning dangling images...${ANSI_NOCOLOR}\n"
dangling=$(docker images -q -f dangling=true)
if [ -n "$dangling" ]; then docker rmi $dangling; fi
