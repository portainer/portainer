#!/bin/sh

buildscripts="$(realpath $(dirname $0))"
c="$buildscripts/ansi_color.sh"; if [ -f "$c" ]; then . "$c"; fi

cd "$(dirname "$buildscripts")"

if [ -z "$ARCHIVE_BUILD_FOLDER" ]; then ARCHIVE_BUILD_FOLDER="//tmp/portainer-builds"; fi

echo ""
echo "ARCHIVE_BUILD_FOLDER: $ARCHIVE_BUILD_FOLDER"
echo "ARTIFACTS: $ARTIFACTS"

if [ "$1" = "-h" ]; then
  echo "${ANSI_RED}Usage: $(basename $0) v<VERSION>"
  echo "       $(basename $0) \"<SH COMMANDS>\"${ANSI_NOCOLOR}"
  exit 1
fi

if [ -z "$(docker container inspect "portainer-factory" 2>&1 | grep "Error:")" ]; then
  docker rm -f "portainer-factory";
fi;

if [ -z "$(docker container inspect "portainer-dev" 2>&1 | grep "Error:")" ]; then
  docker rm -f "portainer-dev";
fi;

if [ -z "$(docker volume inspect "portainer-src-volume" 2>&1 | grep "Error:")" ]; then
  docker volume rm "portainer-src-volume";
fi;

echo ""
echo "${ANSI_DARKCYAN}[FACTORY] Running portainer/factory...${ANSI_NOCOLOR}"

if [ "$(docker ps -q -f name=portainer-factory)" ]; then docker rm -f portainer-factory; fi

docker run -t \
           -v /$(pwd):/work \
           -v portainer-src-volume://src-volume \
           -v //var/run/docker.sock:/var/run/docker.sock \
           --name portainer-factory \
           -e HOST_WORKDIR="/$(dirname $buildscripts)" \
           -e COMMIT_SHA="$(cd $buildscripts && cd .. && git rev-parse HEAD)" \
           -e ARCHIVE_BUILD_FOLDER="$ARCHIVE_BUILD_FOLDER" \
           portainer/factory "$@"

rc=$?

echo ""
echo "${ANSI_DARKCYAN}[FACTORY] Cleaning...${ANSI_NOCOLOR}"

if [ -z "$ARTIFACTS" ]; then
  echo "No ARTIFACTS envvar set"
else
  docker cp "portainer-factory:$ARCHIVE_BUILD_FOLDER" ./
  mv "`basename $ARCHIVE_BUILD_FOLDER`"/ "$ARTIFACTS"
  du -h -d 1 "$ARTIFACTS"
fi

docker rm portainer-factory
docker volume rm portainer-src-volume

if [ $rc -ne 0 ]; then exit $rc; fi

echo ""
echo "${ANSI_DARKCYAN}[FACTORY] Docker images${ANSI_NOCOLOR}"
docker images --filter=reference='portainer/*'
