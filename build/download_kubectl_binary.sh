#!/usr/bin/env bash

PLATFORM=$1
ARCH=$2
KUBECTL_VERSION=$3


if [ "${PLATFORM}" == 'linux' ]; then
  wget -O "dist/kubectl" "https://storage.googleapis.com/kubernetes-release/release/${KUBECTL_VERSION}/bin/${PLATFORM}/${ARCH}/kubectl"
  chmod +x "dist/kubectl"
elif [ "${PLATFORM}" == 'windows' ]; then
  wget -O "dist/kubectl.exe" "https://storage.googleapis.com/kubernetes-release/release/${KUBECTL_VERSION}/bin/windows/amd64/kubectl.exe"
  chmod +x "dist/kubectl.exe"
fi

exit 0
