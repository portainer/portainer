export GOPATH="$AGENT_BUILDDIRECTORY/api"
binary="portainer"

mkdir -p dist
mkdir -p api/src/github.com/portainer/

cp -R api/ api/src/github.com/portainer/portainer/

cd 'api/cmd/portainer'

go get -t -d -v ./...
GOOS=$1 GOARCH=$2 CGO_ENABLED=0 go build -a --installsuffix cgo --ldflags '-s'

mv "$AGENT_BUILDDIRECTORY/api/cmd/portainer/$binary" "$AGENT_BUILDDIRECTORY/dist/portainer"