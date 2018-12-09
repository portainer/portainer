IMAGE="$1"	
ARCH="$2"	
PORTAINER_VERSION="$3"	
DOCKER_USER="$4"	
DOCKER_PASS="$5"

mkdir -pv portainer
cp -r dist/* portainer

tar cvpfz "portainer-$PORTAINER_VERSION-$IMAGE-$ARCH.tar.gz" portainer
sha256sum --tag "portainer-$PORTAINER_VERSION-$IMAGE-$ARCH.tar.gz" > "portainer-$PORTAINER_VERSION-$IMAGE-$ARCH-checksum.txt"

tag="$IMAGE-$ARCH"

docker build -t "portainer/portainer:$IMAGE-$ARCH-$PORTAINER_VERSION" -f build/linux/Dockerfile .
docker tag "portainer/portainer:$IMAGE-$ARCH-$PORTAINER_VERSION" "portainer/portainer:$IMAGE-$ARCH"
docker login -u "$DOCKER_USER" -p "$DOCKER_PASS"
docker push "portainer/portainer:$IMAGE-$ARCH-$PORTAINER_VERSION"
docker push "portainer/portainer:$IMAGE-$ARCH"

if [ "${2}" == 's390x' ] ; then
  docker -D manifest create "portainer/portainer:latest" \
    "portainer/portainer:linux-amd64" \
    "portainer/portainer:linux-arm" \
    "portainer/portainer:linux-arm64" \
    "portainer/portainer:linux-ppc64le" \
    "portainer/portainer:linux-s390x" \
    "portainer/portainer:windows-amd64" \
    "portainer/portainer:windows1709-amd64" \
    "portainer/portainer:windows1803-amd64"

  docker manifest push "portainer/portainer:latest"

  docker -D manifest create "portainer/portainer:${PORTAINER_VERSION}" \
    "portainer/portainer:linux-amd64-${PORTAINER_VERSION}" \
    "portainer/portainer:linux-arm-${PORTAINER_VERSION}" \
    "portainer/portainer:linux-arm64-${PORTAINER_VERSION}" \
    "portainer/portainer:linux-ppc64le-${PORTAINER_VERSION}" \
    "portainer/portainer:linux-s390x-${PORTAINER_VERSION}" \
    "portainer/portainer:windows-amd64-${PORTAINER_VERSION}" \
    "portainer/portainer:windows1709-amd64-${PORTAINER_VERSION}" \
    "portainer/portainer:windows1803-amd64-${PORTAINER_VERSION}"

  docker manifest push "portainer/portainer:${PORTAINER_VERSION}"
fi
