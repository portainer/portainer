#!/usr/bin/env bash

ARCHIVE_BUILD_FOLDER="/tmp/portainer-builds"
VERSION=$1

if [[ $# -ne 1 ]] ; then
  echo "Usage: $(basename $0) <VERSION>"
  exit 1
fi

# parameters platform, architecture
function build_and_push_images() {
  PLATFORM=$1
  ARCH=$2

  docker build -t portainer/portainer:${PLATFORM}-${ARCH}-${VERSION} -f build/linux/Dockerfile .
  docker push portainer/portainer:${PLATFORM}-${ARCH}-${VERSION}
  docker build -t portainer/portainer:${PLATFORM}-${ARCH} -f build/linux/Dockerfile .
  docker push portainer/portainer:${PLATFORM}-${ARCH}
}

# parameters: platform, architecture
function build_archive() {
  PLATFORM=$1
  ARCH=$2

  BUILD_FOLDER=${ARCHIVE_BUILD_FOLDER}/${PLATFORM}-${ARCH}

  rm -rf ${BUILD_FOLDER} && mkdir -pv ${BUILD_FOLDER}/portainer
  mv dist/* ${BUILD_FOLDER}/portainer/
  cd ${BUILD_FOLDER}
  tar cvpfz portainer-${VERSION}-${PLATFORM}-${ARCH}.tar.gz portainer
  mv portainer-${VERSION}-${PLATFORM}-${ARCH}.tar.gz ${ARCHIVE_BUILD_FOLDER}/
  cd -
}

mkdir -pv /tmp/portainer-builds

PLATFORM="linux"
ARCH="amd64"
grunt release-${PLATFORM}-${ARCH}
build_and_push_images ${PLATFORM} ${ARCH}
build_archive ${PLATFORM} ${ARCH}

PLATFORM="linux"
ARCH="386"
grunt release-${PLATFORM}-${ARCH}
build_and_push_images ${PLATFORM} ${ARCH}
build_archive ${PLATFORM} ${ARCH}

PLATFORM="linux"
ARCH="arm"
grunt release-${PLATFORM}-${ARCH}
build_and_push_images ${PLATFORM} ${ARCH}
build_archive ${PLATFORM} ${ARCH}

PLATFORM="linux"
ARCH="arm64"
grunt release-${PLATFORM}-${ARCH}
build_and_push_images ${PLATFORM} ${ARCH}
build_archive ${PLATFORM} ${ARCH}

PLATFORM="linux"
ARCH="ppc64le"
grunt release-${PLATFORM}-${ARCH}
build_and_push_images ${PLATFORM} ${ARCH}
build_archive ${PLATFORM} ${ARCH}

PLATFORM="darwin"
ARCH="amd64"
grunt release-${PLATFORM}-${ARCH}
build_archive ${PLATFORM} ${ARCH}

PLATFORM="windows"
ARCH="amd64"
grunt release-${PLATFORM}-${ARCH}
build_archive ${PLATFORM} ${ARCH}

exit 0
