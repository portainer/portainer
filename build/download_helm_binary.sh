#!/usr/bin/env bash

PLATFORM=$1
ARCH=$2
HELM_VERSION=$3

HELM_DIST="helm-$HELM_VERSION-$PLATFORM-$ARCH"

if [ "${PLATFORM}" == 'linux' ]; then
  wget -qO- "https://get.helm.sh/${HELM_DIST}.tar.gz" | tar -x -z --strip-components 1 "${PLATFORM}-${ARCH}/helm"
  mv "helm" "dist/helm"
  chmod +x "dist/helm"
elif [ "${PLATFORM}" == 'darwin' ]; then
  wget -qO- "https://get.helm.sh/helm-canary-darwin-amd64.tar.gz" | tar -x -z --strip-components 1 "darwin-amd64/helm"
  mv "helm" "dist/helm"
  chmod +x "dist/helm"
elif [ "${PLATFORM}" == 'windows' ]; then
  wget -q -O tmp.zip "https://get.helm.sh/${HELM_DIST}.zip" && unzip -o -j tmp.zip "${PLATFORM}-${ARCH}/helm.exe" -d dist && rm -f tmp.zip
fi

exit 0
