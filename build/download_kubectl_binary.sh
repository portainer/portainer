#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 3 ]]; then
    echo "Illegal number of parameters" >&2
    exit 1
fi

PLATFORM=$1
ARCH=$2
KUBECTL_VERSION=$3

if [[ ${PLATFORM} == "windows" ]]; then
  wget --tries=3 --waitretry=30 --quiet -O "dist/kubectl.exe" "https://dl.k8s.io/${KUBECTL_VERSION}/bin/windows/amd64/kubectl.exe"
  chmod +x "dist/kubectl.exe"
else
  wget --tries=3 --waitretry=30 --quiet -O "dist/kubectl" "https://dl.k8s.io/${KUBECTL_VERSION}/bin/${PLATFORM}/${ARCH}/kubectl"
  chmod +x "dist/kubectl"
fi
