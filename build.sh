#!/usr/bin/env bash

VERSION=$1

if [[ $# -ne 1 ]] ; then
  echo "Usage: $(basename $0) <VERSION>"
  exit 1
fi

mkdir -pv /tmp/portainer-builds

grunt release
docker build -t portainer/portainer:linux-amd64-${VERSION} -f build/linux/Dockerfile .
docker push portainer/portainer:linux-amd64-${VERSION}
docker build -t portainer/portainer:linux-amd64 -f build/linux/Dockerfile .
docker push portainer/portainer:linux-amd64
rm -rf /tmp/portainer-builds/unix && mkdir -pv /tmp/portainer-builds/unix/portainer
mv dist/* /tmp/portainer-builds/unix/portainer
cd /tmp/portainer-builds/unix
tar cvpfz portainer-${VERSION}-linux-amd64.tar.gz portainer
mv portainer-${VERSION}-linux-amd64.tar.gz /tmp/portainer-builds/
cd -

grunt release-arm
docker build -t portainer/portainer:linux-arm-${VERSION} -f build/linux/Dockerfile .
docker push portainer/portainer:linux-arm-${VERSION}
docker build -t portainer/portainer:linux-arm -f build/linux/Dockerfile .
docker push portainer/portainer:linux-arm
rm -rf /tmp/portainer-builds/arm && mkdir -pv /tmp/portainer-builds/arm/portainer
mv dist/* /tmp/portainer-builds/arm/portainer
cd /tmp/portainer-builds/arm
tar cvpfz portainer-${VERSION}-linux-arm.tar.gz portainer
mv portainer-${VERSION}-linux-arm.tar.gz /tmp/portainer-builds/
cd -

grunt release-arm64
docker build -t portainer/portainer:linux-arm64-${VERSION} -f build/linux/Dockerfile .
docker push portainer/portainer:linux-arm64-${VERSION}
docker build -t portainer/portainer:linux-arm64 -f build/linux/Dockerfile .
docker push portainer/portainer:linux-arm64
rm -rf /tmp/portainer-builds/arm64 && mkdir -pv /tmp/portainer-builds/arm64/portainer
mv dist/* /tmp/portainer-builds/arm64/portainer
cd /tmp/portainer-builds/arm64
tar cvpfz portainer-${VERSION}-linux-arm64.tar.gz portainer
mv portainer-${VERSION}-linux-arm64.tar.gz /tmp/portainer-builds/
cd -

grunt release-macos
rm -rf /tmp/portainer-builds/darwin && mkdir -pv /tmp/portainer-builds/darwin/portainer
mv dist/* /tmp/portainer-builds/darwin/portainer
cd /tmp/portainer-builds/darwin
tar cvpfz portainer-${VERSION}-darwin-amd64.tar.gz portainer
mv portainer-${VERSION}-darwin-amd64.tar.gz /tmp/portainer-builds/
cd -

grunt release-win
rm -rf /tmp/portainer-builds/win && mkdir -pv /tmp/portainer-builds/win/portainer
cp -r dist/* /tmp/portainer-builds/win/portainer
cd /tmp/portainer-builds/win
tar cvpfz portainer-${VERSION}-windows-amd64.tar.gz portainer
mv portainer-${VERSION}-windows-amd64.tar.gz /tmp/portainer-builds/

exit 0
