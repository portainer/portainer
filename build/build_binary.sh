#!/usr/bin/env bash
set -euo pipefail

mkdir -p dist

# populate tool versions

BUILDNUMBER=${BUILDNUMBER:-"N/A"}
CONTAINER_IMAGE_TAG=${CONTAINER_IMAGE_TAG:-"N/A"}
NODE_VERSION=${NODE_VERSION:-$(node -v)}
YARN_VERSION=${YARN_VERSION:-$(yarn --version)}
WEBPACK_VERSION=${WEBPACK_VERSION:-$(yarn list webpack --depth=0 | grep webpack | awk -F@ '{print $2}')}
GO_VERSION=${GO_VERSION:-$(go version | awk '{print $3}')}
GIT_COMMIT_HASH=${GIT_COMMIT_HASH:-$(git rev-parse --short HEAD)}

# copy templates
cp -r "./mustache-templates" "./dist"


cd api || exit 1
# the go get adds 8 seconds
go get -t -d -v ./...


ldflags="-s -X 'github.com/portainer/liblicense.LicenseServerBaseURL=https://api.portainer.io' \
-X 'github.com/portainer/portainer/api/build.BuildNumber=${BUILDNUMBER}' \
-X 'github.com/portainer/portainer/api/build.ImageTag=${CONTAINER_IMAGE_TAG}' \
-X 'github.com/portainer/portainer/api/build.NodejsVersion=${NODE_VERSION}' \
-X 'github.com/portainer/portainer/api/build.YarnVersion=${YARN_VERSION}' \
-X 'github.com/portainer/portainer/api/build.WebpackVersion=${WEBPACK_VERSION}' \
-X 'github.com/portainer/portainer/api/build.GitCommit=${GIT_COMMIT_HASH}' \
-X 'github.com/portainer/portainer/api/build.GoVersion=${GO_VERSION}'"

BINARY_VERSION_FILE="../binary-version.json"

echo "$ldflags"

# the build takes 2 seconds
GOOS=${1:-$(go env GOOS)} GOARCH=${2:-$(go env GOARCH)} CGO_ENABLED=0 go build \
	-trimpath \
	--installsuffix cgo \
	--ldflags "$ldflags" \
	-o "../dist/portainer" \
	./cmd/portainer/
