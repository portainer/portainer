#!/usr/bin/env bash

PLATFORM=$1
ARCH=$2
KOMPOSE_VERSION=$3

if [ "${PLATFORM}" == 'linux' ]; then
  wget -O "dist/kompose" "https://github.com/kubernetes/kompose/releases/download/${KOMPOSE_VERSION}/kompose-${PLATFORM}-${ARCH}"
  chmod +x "dist/kompose"
elif [ "${PLATFORM}" == 'windows' ]; then
  wget -O "dist/kompose.exe" "https://github.com/kubernetes/kompose/releases/download/${KOMPOSE_VERSION}/kompose-windows-amd64.exe"
  chmod +x "dist/kompose.exe"
fi

exit 0
