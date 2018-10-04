if [ ! -z "${APPVEYOR_PULL_REQUEST_NUMBER}" ] ; then
  tag="pr${APPVEYOR_PULL_REQUEST_NUMBER}"
  docker build -t "ssbkang/portainer:$tag" -f build/linux/Dockerfile .
  docker login -u "${DOCKER_USER}" -p "${DOCKER_PASS}"
  docker push "ssbkang/portainer:$tag"

elif [ -z "${APPVEYOR_PULL_REQUEST_NUMBER}" ] ; then
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