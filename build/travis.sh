#!/bin/sh

exitcode() {
  if [ "$1" -ne "0" ]; then
    echo "$2! $1"
    exit "$1"
  fi
}

export COMMIT_COMMAND=`echo "$TRAVIS_COMMIT_MESSAGE" | grep -Po "\[ci \K(.+)(?=\])"`

echo "PULL REQUEST: $TRAVIS_PULL_REQUEST"
echo "COMMAND: $COMMIT_COMMAND"

get_factory_imgs() {
  if [ -f ".cache/portainer_factory_imgs.tgz" ]; then
    docker load < .cache/portainer_factory_imgs.tgz
  else
    #docker pull portainer/factory
    #docker pull portainer/builder
    docker pull 11384eb/portainer:factory
    docker tag 11384eb/portainer:factory portainer/factory
    docker rm 11384eb/portainer:factory

    docker pull 11384eb/portainer:builder
    docker tag 11384eb/portainer:builder portainer/builder
    docker pull 11384eb/portainer:builder
  fi
}

if [ "$1" = "deploy" ]; then
  case "$COMMIT_COMMAND" in
    "factory")
      ./build/factory_deploy.sh "$TRAVIS_BRANCH" 'build-system'
      ./build/factory_deploy.sh "$TRAVIS_BRANCH" 'linux-amd64'
    ;;
    "release")
      ./build/factory_deploy.sh "$TRAVIS_BRANCH" 'linux-amd64 linux-386 linux-arm linux-arm64 linux-ppc64le darwin-amd64 windows-amd64'
    ;;
    *)
      ./build/factory_deploy.sh "$TRAVIS_BRANCH" 'linux-amd64'
    ;;
  esac
else
  case "$COMMIT_COMMAND" in
    "factory")
      ./build/factory_create.sh
      exitcode "$?" "Building portainer/factory failed"
      # Just test that the factory works
      ./build/factory_run.sh "ls -la" "grunt lint"
      exitcode "$?" "Running <grunt lint> in portainer/factory failed"

     # Save factory images to cache
      mkdir -pv .cache
      docker image save portainer/factory portainer/builder | gzip -c > ".cache/portainer_factory_imgs.tgz"
      exitcode "$?" "Saving factory images to .cache failed"
      ARTIFACTS='artifacts' ./build/factory_run.sh "v$TRAVIS_BRANCH" linux:amd64
      exitcode "$?" "Test build v$TRAVIS_BRANCH linux:amd64 failed"
    ;;
    "release")
      get_factory_imgs
      # Release all platforms, creates tarballs and images (with two tags each)
      ARTIFACTS='./artifacts' ./build/factory_run.sh "v$TRAVIS_BRANCH" "all"
      exitcode "$?" "Build v$TRAVIS_BRANCH all failed"
    ;;
    *)
      get_factory_imgs
      # Release a single platform
      ARTIFACTS='artifacts' ./build/factory_run.sh "v$TRAVIS_BRANCH" linux:amd64
      exitcode "$?" "Build v$TRAVIS_BRANCH linux:amd64 failed"
    ;;
  esac
fi

# Run grunt locally, i.e. without portainer/factory
# WORKDIR='' DISTDIR='dist' grunt
