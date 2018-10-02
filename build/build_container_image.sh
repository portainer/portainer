docker build -t "ssbkang/portainer:$1-$2-$3" -f build/linux/Dockerfile .
docker tag "ssbkang/portainer:$1-$2-$3" "ssbkang/portainer:$1-$2"
docker login -u "$4" -p "$5"
docker push "ssbkang/portainer:$1-$2-$3"
docker push "ssbkang/portainer:$1-$2"