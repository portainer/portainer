#!/usr/bin/env bash
set -euo pipefail

BUILD_SOURCESDIRECTORY=${BUILD_SOURCESDIRECTORY:-$(pwd)}

mkdir -p dist

# populate tool versions

BUILDNUMBER=${BUILDNUMBER:-"N/A"}
CONTAINER_IMAGE_TAG=${CONTAINER_IMAGE_TAG:-"N/A"}
NODE_VERSION=${NODE_VERSION:-$(node -v)}
PNPM_VERSION=${PNPM_VERSION:-$(pnpm -v)}
WEBPACK_VERSION=${WEBPACK_VERSION:-$(pnpm list webpack --depth=0 | grep webpack | awk '{print $2}')}
GO_VERSION=${GO_VERSION:-$(go version | awk '{print $3}')}
GIT_COMMIT_HASH=${GIT_COMMIT_HASH:-$(git rev-parse --short HEAD)}

# populate dependencies versions
DOCKER_VERSION=$(go list -m -f '{{.Version}}' github.com/docker/docker)
COMPOSE_VERSION=$(go list -m -f '{{.Version}}' github.com/docker/compose/v2)
# Kubernetes SDK uses v0.x.y versioning, but official kubectl releases use v1.x.y
# We need to transform the version (e.g., v0.33.2 -> v1.33.2)
KUBECTL_VERSION=$(go list -modfile go.mod -m -f '{{.Version}}' k8s.io/kubectl | sed 's/^v0\./v1./' | sed 's/^0\./1./')
HELM_VERSION=$(go list -modfile go.mod -m -f '{{.Version}}' helm.sh/helm/v4)

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
-X 'github.com/portainer/portainer/pkg/build.PnpmVersion=${PNPM_VERSION}' \
-X 'github.com/portainer/portainer/pkg/build.WebpackVersion=${WEBPACK_VERSION}' \
-X 'github.com/portainer/portainer/pkg/build.GitCommit=${GIT_COMMIT_HASH}' \
-X 'github.com/portainer/portainer/pkg/build.GoVersion=${GO_VERSION}' \
-X 'github.com/portainer/portainer/pkg/build.DepComposeVersion=${COMPOSE_VERSION}' \
-X 'github.com/portainer/portainer/pkg/build.DepDockerVersion=${DOCKER_VERSION}' \
-X 'github.com/portainer/portainer/pkg/build.DepKubectlVersion=${KUBECTL_VERSION}' \
-X 'github.com/portainer/portainer/pkg/build.DepHelmVersion=${HELM_VERSION}'"

echo "$ldflags"


# See: https://gist.github.com/asukakenji/f15ba7e588ac42795f421b48b8aede63
# For a list of valid GOOS and GOARCH values
PLATFORM=${1:-$(go env GOOS)}
ARCH=${2:-$(go env GOARCH)}
# if the default platform is darwin, set it to linux to allow it to run in the portainer/base image (which doesn't support darwin)
if [ "$PLATFORM" = "darwin" ]; then
  PLATFORM="linux"
fi

BINARY_NAME="portainer"
if [ "$PLATFORM" = "windows" ]; then
  BINARY_NAME="portainer.exe"
fi

GOOS=${PLATFORM} GOARCH=${ARCH} CGO_ENABLED=0 go build \
	-trimpath \
	--installsuffix cgo \
	--ldflags "$ldflags" \
	-o "../dist/${BINARY_NAME}" \
	./cmd/portainer/
