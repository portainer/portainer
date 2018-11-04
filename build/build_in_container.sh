export GOPATH="$APPVEYOR_BUILD_FOLDER/api"
binary="portainer"

mkdir -p dist
mkdir -p api/src/github.com/portainer/

echo $GOPATH
cp -R api/ api/src/github.com/portainer/portainer/

cd 'api/cmd/portainer'

go get -t -d -v ./...
GOOS=$1 GOARCH=$2 CGO_ENABLED=0 go build -a --installsuffix cgo --ldflags '-s'

#docker run --rm -tv "$(pwd)/api:/src" -e BUILD_GOOS="$1" -e BUILD_GOARCH="$2" portainer/golang-builder:cross-platform /src/cmd/portainer

mv "$APPVEYOR_BUILD_FOLDER/api/cmd/portainer/$binary" dist/portainer

sha256sum "$APPVEYOR_BUILD_FOLDER/dist/$binary" > portainer-checksum.txt