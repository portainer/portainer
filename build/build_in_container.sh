export GOPATH="$APPVEYOR_BUILD_FOLDER/api"
binary="portainer"

mkdir -p dist
mkdir -p api/src/github.com/portainer/

cp -R api/ api/src/github.com/portainer/portainer/

cd 'api/cmd/portainer'

go get -t -d -v ./...
GOOS=$1 GOARCH=$2 CGO_ENABLED=0 go build -a --installsuffix cgo --ldflags '-s'

mv "$APPVEYOR_BUILD_FOLDER/api/cmd/portainer/$binary" "$APPVEYOR_BUILD_FOLDER/dist/portainer"