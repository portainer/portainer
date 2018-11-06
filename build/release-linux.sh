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

docker build -t "ssbkang/portainer:$IMAGE-$ARCH-$PORTAINER_VERSION" -f build/linux/Dockerfile .
docker tag "ssbkang/portainer:$IMAGE-$ARCH-$PORTAINER_VERSION" "ssbkang/portainer:$IMAGE-$ARCH"
docker login -u "$DOCKER_USER" -p "$DOCKER_PASS"
docker push "ssbkang/portainer:$IMAGE-$ARCH-$PORTAINER_VERSION"
docker push "ssbkang/portainer:$IMAGE-$ARCH"

if [ "${2}" == 's390x' ] ; then
  docker -D manifest create "ssbkang/portainer:latest" \
    "ssbkang/portainer:linux-amd64" \
    "ssbkang/portainer:linux-arm" \
    "ssbkang/portainer:linux-arm64" \
    "ssbkang/portainer:linux-ppc64le" \
    "ssbkang/portainer:linux-s390x" \
    "ssbkang/portainer:windows-amd64" \
    "ssbkang/portainer:windows1709-amd64" \
    "ssbkang/portainer:windows1803-amd64"

  docker manifest push "ssbkang/portainer:latest"

  docker -D manifest create "ssbkang/portainer:${PORTAINER_VERSION}" \
    "ssbkang/portainer:linux-amd64-${PORTAINER_VERSION}" \
    "ssbkang/portainer:linux-arm-${PORTAINER_VERSION}" \
    "ssbkang/portainer:linux-arm64-${PORTAINER_VERSION}" \
    "ssbkang/portainer:linux-ppc64le-${PORTAINER_VERSION}" \
    "ssbkang/portainer:linux-s390x-${PORTAINER_VERSION}" \
    "ssbkang/portainer:windows-amd64-${PORTAINER_VERSION}" \
    "ssbkang/portainer:windows1709-amd64-${PORTAINER_VERSION}" \
    "ssbkang/portainer:windows1803-amd64-${PORTAINER_VERSION}"

  docker manifest push "ssbkang/portainer:${PORTAINER_VERSION}"
fi