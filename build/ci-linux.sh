IMAGE="$1"	
ARCH="$2"	
PORTAINER_VERSION="$3"	
DOCKER_USER="$4"	
DOCKER_PASS="$5"	
GITHUB_MANIFEST_URL="$6"	
APPVEYOR_PULL_REQUEST_NUMBER="$7"

if [ "${APPVEYOR_PULL_REQUEST_NUMBER}" ]; then
  tag="pr${APPVEYOR_PULL_REQUEST_NUMBER}-$IMAGE-$ARCH"
  manifest="${APPVEYOR_PULL_REQUEST_NUMBER}"
else
  tag="${APPVEYOR_REPO_BRANCH}-$IMAGE-$ARCH"
  manifest="${APPVEYOR_REPO_BRANCH}"
fi

docker build -t "ssbkang/portainer:$tag" -f build/linux/Dockerfile .
docker login -u "${DOCKER_USER}" -p "${DOCKER_PASS}"
docker push "ssbkang/portainer:$tag"

docker -D manifest create "ssbkang/portainer:$manifest" \
  "ssbkang/portainer:$tag-linux-amd64" \
  "ssbkang/portainer:$tag-windows-amd64" \
  "ssbkang/portainer:$tag-windows1709-amd64" \
  "ssbkang/portainer:$tag-windows1803-amd64"

docker manifest push "ssbkang/portainer:$manifest"