IMAGE="$1"	
ARCH="$2"	
PORTAINER_VERSION="$3"	
DOCKER_USER="$4"	
DOCKER_PASS="$5"	
GITHUB_MANIFEST_URL="$6"	
APPVEYOR_PULL_REQUEST_NUMBER="$7"

if [ "${APPVEYOR_PULL_REQUEST_NUMBER}" ]; then
  tag="pr${APPVEYOR_PULL_REQUEST_NUMBER}-$IMAGE-$ARCH"
  docker build -t "ssbkang/portainer:$tag" -f build/linux/Dockerfile .
  docker login -u "${DOCKER_USER}" -p "${DOCKER_PASS}"
  docker push "ssbkang/portainer:$tag"

  docker -D manifest create "ssbkang/portainer:pr${APPVEYOR_PULL_REQUEST_NUMBER}" \
    "ssbkang/portainer:pr${APPVEYOR_PULL_REQUEST_NUMBER}-linux-amd64" \
    "ssbkang/portainer:pr${APPVEYOR_PULL_REQUEST_NUMBER}-windows-amd64" \
    "ssbkang/portainer:pr${APPVEYOR_PULL_REQUEST_NUMBER}-windows1709-amd64" \
    "ssbkang/portainer:pr${APPVEYOR_PULL_REQUEST_NUMBER}-windows1803-amd64"

  docker manifest push "ssbkang/portainer:$env:APPVEYOR_REPO_TAG_NAME"
else
  mkdir -pv portainer
  cp -r dist/* portainer
  tar cvpfz "portainer-$PORTAINER_VERSION-$IMAGE-$ARCH.tar.gz" portainer
  tag="$IMAGE-$ARCH"

  docker build -t "ssbkang/portainer:$IMAGE-$ARCH-$PORTAINER_VERSION" -f build/linux/Dockerfile .
  docker tag "ssbkang/portainer:$IMAGE-$ARCH-$PORTAINER_VERSION" "ssbkang/portainer:$IMAGE-$ARCH"
  docker login -u "$DOCKER_USER" -p "$DOCKER_PASS"
  docker push "ssbkang/portainer:$IMAGE-$ARCH-$PORTAINER_VERSION"
  docker push "ssbkang/portainer:$IMAGE-$ARCH"

  if [ "${2}" == 's390x' ] ; then
    wget https://github.com/estesp/manifest-tool/releases/download/v0.8.0/manifest-tool-linux-amd64
    git clone -q --branch=master $6 /home/appveyor/projects/docker-manifest

    chmod 755 manifest-tool-linux-amd64
    
    ./manifest-tool-linux-amd64 push from-spec /home/appveyor/projects/docker-manifest/portainer/portainer-1-19-2.yml
    ./manifest-tool-linux-amd64 push from-spec /home/appveyor/projects/docker-manifest/portainer/portainer.yml
  fi
fi