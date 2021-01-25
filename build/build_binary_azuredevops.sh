export GOPATH="/tmp/go"

binary="portainer"

mkdir -p dist
mkdir -p ${GOPATH}/src/github.com/portainer/portainer

cp -R api ${GOPATH}/src/github.com/portainer/portainer/api

cd 'api/cmd/portainer'

go get -t -d -v ./...
GOOS=$1 GOARCH=$2 CGO_ENABLED=0 go build -a --installsuffix cgo --ldflags "-s -X github.com/portainer/liblicense.LicenseServerBaseURL=https://api.portainer.io"

mv "$BUILD_SOURCESDIRECTORY/api/cmd/portainer/$binary" "$BUILD_SOURCESDIRECTORY/dist/portainer"
