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
  wget -O "dist/kubectl.exe" "https://storage.googleapis.com/kubernetes-release/release/${KUBECTL_VERSION}/bin/windows/amd64/kubectl.exe"
  chmod +x "dist/kubectl.exe"
else
  wget -O "dist/kubectl" "https://storage.googleapis.com/kubernetes-release/release/${KUBECTL_VERSION}/bin/${PLATFORM}/${ARCH}/kubectl"
  chmod +x "dist/kubectl"
fi
