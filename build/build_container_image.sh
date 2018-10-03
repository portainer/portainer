docker build -t "ssbkang/portainer:$1-$2-$3" -f build/linux/Dockerfile .
docker tag "ssbkang/portainer:$1-$2-$3" "ssbkang/portainer:$1-$2"
docker login -u "$4" -p "$5"
docker push "ssbkang/portainer:$1-$2-$3"
docker push "ssbkang/portainer:$1-$2"

if [ "${2}" == 's390x' ] ; then
  go get github.com/estesp/manifest-tool
  git clone -q --branch=master $6 /home/appveyor/projects/docker-manifest
  manifest-tool push from-spec /home/appveyor/projects/docker-manifest/portainer-1-19-2.yml
  manifest-tool push from-spec /home/appveyor/projects/docker-manifest/portainer.yml
fi