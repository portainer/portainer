#!/usr/bin/env bash
set -euo pipefail

BUILD_SOURCESDIRECTORY=${BUILD_SOURCESDIRECTORY:-$(pwd)}
BINARY_VERSION_FILE="$BUILD_SOURCESDIRECTORY/binary-version.json"

if [[ ! -f $BINARY_VERSION_FILE ]] ; then
    echo 'File $BINARY_VERSION_FILE not found, aborting build.'
    exit 1
fi

mkdir -p dist

# populate tool versions

BUILDNUMBER=${BUILDNUMBER:-"N/A"}
CONTAINER_IMAGE_TAG=${CONTAINER_IMAGE_TAG:-"N/A"}
NODE_VERSION=${NODE_VERSION:-$(node -v)}
YARN_VERSION=${YARN_VERSION:-$(yarn --version)}
WEBPACK_VERSION=${WEBPACK_VERSION:-$(yarn list webpack --depth=0 | grep webpack | awk -F@ '{print $2}')}
GO_VERSION=${GO_VERSION:-$(go version | awk '{print $3}')}
GIT_COMMIT_HASH=${GIT_COMMIT_HASH:-$(git rev-parse --short HEAD)}

# populate dependencies versions
DOCKER_VERSION=$(jq -r '.docker' < "${BINARY_VERSION_FILE}")
HELM_VERSION=$(jq -r '.helm' < "${BINARY_VERSION_FILE}")
KUBECTL_VERSION=$(jq -r '.kubectl' < "${BINARY_VERSION_FILE}")
COMPOSE_VERSION=$(go list -m -f '{{.Version}}' github.com/docker/compose/v2)

# copy templates
cp -r "./mustache-templates" "./dist"


cd api || exit 1

# Conditionally run go get based on the SKIP_GO_GET environment variable
# This process adds a bit of time to the build
# This is useful in the CI/CD pipeline to ensure that all dependencies are available
if [ "${SKIP_GO_GET:-false}" = false ]; then
  echo "Running go get -t -v ./..."
  go get -t -v ./...
fi


ldflags="-s -X 'github.com/portainer/liblicense.LicenseServerBaseURL=https://api.portainer.io' \
-X 'github.com/portainer/portainer/pkg/build.BuildNumber=${BUILDNUMBER}' \
-X 'github.com/portainer/portainer/pkg/build.ImageTag=${CONTAINER_IMAGE_TAG}' \
-X 'github.com/portainer/portainer/pkg/build.NodejsVersion=${NODE_VERSION}' \
-X 'github.com/portainer/portainer/pkg/build.YarnVersion=${YARN_VERSION}' \
-X 'github.com/portainer/portainer/pkg/build.WebpackVersion=${WEBPACK_VERSION}' \
-X 'github.com/portainer/portainer/pkg/build.GitCommit=${GIT_COMMIT_HASH}' \
-X 'github.com/portainer/portainer/pkg/build.GoVersion=${GO_VERSION}' \
-X 'github.com/portainer/portainer/pkg/build.DepComposeVersion=${COMPOSE_VERSION}' \
-X 'github.com/portainer/portainer/pkg/build.DepDockerVersion=${DOCKER_VERSION}' \
-X 'github.com/portainer/portainer/pkg/build.DepHelmVersion=${HELM_VERSION}' \
-X 'github.com/portainer/portainer/pkg/build.DepKubectlVersion=${KUBECTL_VERSION}'"

echo "$ldflags"

GOOS=${1:-$(go env GOOS)} GOARCH=${2:-$(go env GOARCH)} CGO_ENABLED=0 go build \
	-trimpath \
	--installsuffix cgo \
	--ldflags "$ldflags" \
	-o "../dist/portainer" \
	./cmd/portainer/
