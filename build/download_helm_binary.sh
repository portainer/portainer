#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 3 ]]; then
    echo "Illegal number of parameters" >&2
    exit 1
fi

PLATFORM=$1
ARCH=$2
HELM_VERSION=$3
HELM_DIST="helm-$HELM_VERSION-$PLATFORM-$ARCH"


if [[ ${PLATFORM} == "windows" ]]; then
  wget -O tmp.zip "https://get.helm.sh/${HELM_DIST}.zip" && unzip -o -j tmp.zip "${PLATFORM}-${ARCH}/helm.exe" -d dist && rm -f tmp.zip
else
  wget -qO- "https://get.helm.sh/${HELM_DIST}.tar.gz" | tar -x -z --strip-components 1 "${PLATFORM}-${ARCH}/helm"
  mv "helm" "dist/helm"
  chmod +x "dist/helm"
fi
