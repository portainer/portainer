#!/usr/bin/env sh

c="/etc/profile.d/ansi_color.sh"; if [ -f "$c" ]; then . "$c"; fi

if [ -z "$ARCHIVE_BUILD_FOLDER" ]; then ARCHIVE_BUILD_FOLDER="/tmp/portainer-builds"; fi
echo "ARCHIVE_BUILD_FOLDER: $ARCHIVE_BUILD_FOLDER"

work=$(pwd)

# parameter: "platform-architecture"
build_archive() {
  BUILD_FOLDER="${ARCHIVE_BUILD_FOLDER}/$1"
  rm -rf ${BUILD_FOLDER} && mkdir -pv ${BUILD_FOLDER}/portainer
  cp -r dist/* ${BUILD_FOLDER}/portainer/
  cd ${BUILD_FOLDER}
  tar cvpfz "portainer-${VERSION}-$1.tar.gz" portainer 1>> "$work/log.log" 2>&1;
  mv "portainer-${VERSION}-$1.tar.gz" ${ARCHIVE_BUILD_FOLDER}/
  cd -
}

build_image() {
  cd "${ARCHIVE_BUILD_FOLDER}"
  cp "${WORKDIR}build/linux/Dockerfile" ./
  echo "ADD ./portainer-${VERSION}-$1.tar.gz /" >> Dockerfile
  echo Dockerfile
  dos2unix Dockerfile
  img="portainer/portainer:$1"
  docker build -t "${img}-${VERSION}" .
  docker tag "${img}-${VERSION}" "${img}"
  rm Dockerfile
  cd "$work"
}

build_releases() {
  mkdir -pv "${ARCHIVE_BUILD_FOLDER}"
  for tag in $@; do
    printf "\n${ANSI_MAGENTA}[FACTORY] Running $tag...${ANSI_NOCOLOR}\n"
    platform=$(echo $tag | cut -d : -f 1)
    arch=$(echo $tag | cut -d : -f 2)
    pa="$platform-$arch"
    binfile="portainer-$pa"
    ext=""; if [ "$platform" = "windows" ]; then ext=".exe"; fi
    if [ -f "dist/${binfile}${ext}" ]; then
      echo "BinaryExists";
    else
      grunt build:"$tag"
      mv "dist/$binfile${ext}" "dist/portainer${ext}"
      build_archive "$pa"
      rm "dist/portainer${ext}"
      rm "dist/docker${ext}"
      if [ "$platform" == 'linux' ]; then build_image "$pa"; fi
    fi
  done
}

if [ "$1" = "-h" ]; then
  printf "${ANSI_RED}Usage: $(basename $0) v<VERSION>${ANSI_NOCOLOR}\n"
  printf "${ANSI_RED}       $(basename $0) \"<SH COMMANDS>\"${ANSI_NOCOLOR}\n"
  exit 1
fi

mkdir -vp dist

if [ "$(echo "$1" | cut -c1-1)" == 'v' ]; then
  VERSION="$(echo "$1" | cut -c2-)"
  printf "\n${ANSI_MAGENTA}[FACTORY] Building webapp...${ANSI_NOCOLOR}\n"
  grunt frontend:release
  rc=$?; tree dist; if [ $rc -ne 0 ]; then exit $rc; fi
  printf "\n${ANSI_MAGENTA}[FACTORY] Building backend(s)...${ANSI_NOCOLOR}\n"
  releases="$2"
  if [ "$2" = "all" ]; then releases='linux-amd64 linux-arm linux-arm64 linux-ppc64le linux-s390x darwin-amd64 windows-amd64'; fi
  build_releases "$releases"
  rc=$?; ls -la "${ARCHIVE_BUILD_FOLDER}"; if [ $rc -ne 0 ]; then exit $rc; fi
  printf "\n${ANSI_MAGENTA}[FACTORY] Cleaning dangling images...${ANSI_NOCOLOR}\n"
  docker rmi $(docker images -q -f dangling=true)
  printf "\n${ANSI_MAGENTA}[FACTORY] Build $VERSION SUCCESSFUL${ANSI_NOCOLOR}\n"
else
  printf "\n${ANSI_MAGENTA}[FACTORY] Custom run...${ANSI_NOCOLOR}\n"
  for cmd in "$@"; do $cmd; done;
  printf "\n${ANSI_MAGENTA}[FACTORY] Custom run finished${ANSI_NOCOLOR}\n"
fi
