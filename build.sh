#!/usr/bin/env bash

VERSION=$1

if [[ $# -ne 1 ]] ; then
  echo "Usage: $(basename $0) <VERSION>"
  exit 1
fi

grunt release
rm -rf /tmp/portainer-build-unix && mkdir -pv /tmp/portainer-build-unix/portainer
mv dist/* /tmp/portainer-build-unix/portainer
cd /tmp/portainer-build-unix && tar cvpfz portainer-${VERSION}-linux-amd64.tar.gz portainer
cd -

grunt release-win
rm -rf /tmp/portainer-build-win && mkdir -pv /tmp/portainer-build-win/portainer
mv dist/* /tmp/portainer-build-win/portainer
cd /tmp/portainer-build-win
tar cvpfz portainer-${VERSION}-windows-amd64.tar.gz portainer
cd -

grunt release-arm
rm -rf /tmp/portainer-build-arm && mkdir -pv /tmp/portainer-build-arm/portainer
mv dist/* /tmp/portainer-build-arm/portainer
cd /tmp/portainer-build-arm
tar cvpfz portainer-${VERSION}-linux-arm.tar.gz portainer
cd -

grunt release-arm64
rm -rf /tmp/portainer-build-arm64 && mkdir -pv /tmp/portainer-build-arm64/portainer
mv dist/* /tmp/portainer-build-arm64/portainer
cd /tmp/portainer-build-arm64
tar cvpfz portainer-${VERSION}-linux-arm64.tar.gz portainer
cd -

grunt release-macos
rm -rf /tmp/portainer-build-darwin && mkdir -pv /tmp/portainer-build-darwin/portainer
mv dist/* /tmp/portainer-build-darwin/portainer
cd /tmp/portainer-build-darwin
tar cvpfz portainer-${VERSION}-darwin-amd64.tar.gz portainer

exit 0
