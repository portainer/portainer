#!/usr/bin/env bash

PLATFORM=$1
ARCH=$2
KUBECTL_VERSION=$3

wget -O "dist/kubectl" "https://storage.googleapis.com/kubernetes-release/release/${KUBECTL_VERSION}/bin/${PLATFORM}/${ARCH}/kubectl"
chmod +x "dist/kubectl"

exit 0
