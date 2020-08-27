#!/usr/bin/env bash

PLATFORM=$1
ARCH=$2
KOMPOSE_VERSION=$3

wget -O "dist/kompose" "https://github.com/kubernetes/kompose/releases/download/${KOMPOSE_VERSION}/kompose-${PLATFORM}-${ARCH}"
chmod +x "dist/kompose"

exit 0
