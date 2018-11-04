binary="portainer"

mkdir -p dist

echo $APPVEYOR_BUILD_FOLDER
export GOPATH="$APPVEYOR_BUILD_FOLDER/api"

cd 'api/cmd/portainer'

go get -t -d -v ./...
GOOS=$1 GOARCH=$2 CGO_ENABLED=0 go build -a --installsuffix cgo --ldflags '-s'

#docker run --rm -tv "$(pwd)/api:/src" -e BUILD_GOOS="$1" -e BUILD_GOARCH="$2" portainer/golang-builder:cross-platform /src/cmd/portainer

mv "api/cmd/portainer/$binary" dist/portainer

#sha256sum "dist/$binary" > portainer-checksum.txt