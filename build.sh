#!/usr/bin/env bash

VERSION=$1

if [[ $# -ne 1 ]] ; then
  echo "Usage: $(basename $0) <VERSION>"
  exit 1
fi

grunt release
rm -rf /tmp/portainer-build && mkdir -pv /tmp/portainer-build/portainer
mv dist/* /tmp/portainer-build/portainer
cd /tmp/portainer-build
tar cvpfz portainer-${VERSION}.tar.gz portainer

exit 0
