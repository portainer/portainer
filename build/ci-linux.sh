IMAGE="$1"	
ARCH="$2"	
DOCKER_USER="$3"	
DOCKER_PASS="$4"
APPVEYOR_REPO_BRANCH="$5"
APPVEYOR_PULL_REQUEST_NUMBER="$6"

if [ "${APPVEYOR_PULL_REQUEST_NUMBER}" ]; then
  tag="pr${APPVEYOR_PULL_REQUEST_NUMBER}-$IMAGE-$ARCH"
  manifest="pr${APPVEYOR_PULL_REQUEST_NUMBER}"
else
  tag="${APPVEYOR_REPO_BRANCH}-$IMAGE-$ARCH"
  manifest="${APPVEYOR_REPO_BRANCH}"
fi

docker build -t "ssbkang/portainer:$tag" -f build/linux/Dockerfile .
docker login -u "${DOCKER_USER}" -p "${DOCKER_PASS}"
docker push "ssbkang/portainer:$tag"

docker -D manifest create "ssbkang/portainer:$manifest" \
  "ssbkang/portainer:$manifest-linux-amd64" \
  "ssbkang/portainer:$manifest-windows-amd64" \
  "ssbkang/portainer:$manifest-windows1709-amd64" \
  "ssbkang/portainer:$manifest-windows1803-amd64"

docker manifest push "ssbkang/portainer:$manifest"