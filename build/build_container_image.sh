
echo $IMAGE
echo $ARCH
echo $PORTAINER_VERSION

echo "${IMAGE}"
echo "${ARCH}"
echo "${PORTAINER_VERSION}"

#docker build -t "ssbkang/portainer:${IMAGE}-${ARCH}-${PORTAINER_VERSION}" -f build/linux/Dockerfile .
#docker tag "ssbkang/portainer:${IMAGE}-${ARCH}-${PORTAINER_VERSION}" "ssbkang/portainer:${IMAGE}-${ARCH}"
#docker login -u "${DOCKER_USER}" -p "${DOCKER_PASS}"
#docker push "ssbkang/portainer:${IMAGE}-${ARCH}-${PORTAINER_VERSION}"
#docker push "ssbkang/portainer:${IMAGE}-${ARCH}"