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

exit 0
