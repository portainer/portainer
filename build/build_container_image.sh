if [ ${7} ] ; then
  tag="pr$7"
  docker build -t "ssbkang/portainer:$tag" -f build/linux/Dockerfile .
  docker login -u "$4" -p "$5"
  docker push "ssbkang/portainer:$tag"
else
  mkdir -pv portainer
  cp -r dist/* portainer
  tar cvpfz "portainer-$3-$1-$2.tar.gz" portainer
  tag="$1-$2"

  docker build -t "ssbkang/portainer:$1-$2-$3" -f build/linux/Dockerfile .
  docker tag "ssbkang/portainer:$1-$2-$3" "ssbkang/portainer:$1-$2"
  docker login -u "$4" -p "$5"
  docker push "ssbkang/portainer:$1-$2-$3"
  docker push "ssbkang/portainer:$1-$2" 

  if [ "${2}" == 's390x' ] ; then
    wget https://github.com/estesp/manifest-tool/releases/download/v0.8.0/manifest-tool-linux-amd64
    git clone -q --branch=master $6 /home/appveyor/projects/docker-manifest

    chmod 755 manifest-tool-linux-amd64
    
    ./manifest-tool-linux-amd64 push from-spec /home/appveyor/projects/docker-manifest/portainer/portainer-1-19-2.yml
    ./manifest-tool-linux-amd64 push from-spec /home/appveyor/projects/docker-manifest/portainer/portainer.yml
  fi
fi

