#!/bin/sh

set -x

mkdir -p dist

# populate tool versions
BUILDNUMBER="N/A"
CONTAINER_IMAGE_TAG="N/A"
NODE_VERSION="0"
YARN_VERSION="0"
WEBPACK_VERSION="0"
GO_VERSION="0"

cd api
# the go get adds 8 seconds
go get -t -d -v ./...

# the build takes 2 seconds
GOOS=$1 GOARCH=$2 CGO_ENABLED=0 go build \
	--installsuffix cgo \
	--gcflags="-trimpath $(pwd)" \
	--ldflags "-s \
	--X 'github.com/portainer/portainer/api/build.BuildNumber=${BUILDNUMBER}' \
	--X 'github.com/portainer/portainer/api/build.ImageTag=${CONTAINER_IMAGE_TAG}' \
	--X 'github.com/portainer/portainer/api/build.NodejsVersion=${NODE_VERSION}' \
	--X 'github.com/portainer/portainer/api/build.YarnVersion=${YARN_VERSION}' \
	--X 'github.com/portainer/portainer/api/build.WebpackVersion=${WEBPACK_VERSION}' \
	--X 'github.com/portainer/portainer/api/build.GoVersion=${GO_VERSION}'" \
	-o "../dist/portainer" \
	./cmd/portainer/
