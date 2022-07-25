#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 3 ]]; then
    echo "Illegal number of parameters" >&2
    exit 1
fi

PLATFORM=$1
ARCH=$2
KOMPOSE_VERSION=$3


if [[ ${PLATFORM} == "windows" ]]; then
  wget -O "dist/kompose.exe" "https://github.com/kubernetes/kompose/releases/download/${KOMPOSE_VERSION}/kompose-windows-amd64.exe"
  chmod +x "dist/kompose.exe"
elif [[ ${PLATFORM} == "darwin" ]]; then
	# kompose 1.22 doesn't have arm support yet, we could merge darwin and linux scripts after upgrading kompose to >= 1.26.0
	wget -O "dist/kompose" "https://github.com/kubernetes/kompose/releases/download/${KOMPOSE_VERSION}/kompose-${PLATFORM}-amd64"
  chmod +x "dist/kompose"
else
  wget -O "dist/kompose" "https://github.com/kubernetes/kompose/releases/download/${KOMPOSE_VERSION}/kompose-${PLATFORM}-${ARCH}"
  chmod +x "dist/kompose"
fi
