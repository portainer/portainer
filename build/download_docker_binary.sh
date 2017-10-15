#!/usr/bin/env bash

PLATFORM=$1
ARCH=$2
DOCKER_VERSION=$3

DOWNLOAD_FOLDER=".tmp/download"

rm -rf "${DOWNLOAD_FOLDER}"
mkdir -pv "${DOWNLOAD_FOLDER}"

wget -O "${DOWNLOAD_FOLDER}/docker-binaries.tgz" "https://download.docker.com/${PLATFORM}/static/stable/${ARCH}/docker-${DOCKER_VERSION}.tgz"
tar -xf "${DOWNLOAD_FOLDER}/docker-binaries.tgz"

if [ "${PLATFORM}" == 'windows' ]; then
  mv "${DOWNLOAD_FOLDER}/docker/docker.exe" dist/
else
  mv "${DOWNLOAD_FOLDER}/docker/docker" dist/
fi

exit 0
