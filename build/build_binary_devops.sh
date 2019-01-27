export GOPATH="$AGENT_BUILDDIRECTORY/api"
binary="portainer"

ls -la api/

mkdir -p dist
mkdir -p api/src/github.com/portainer/
mkdir -p api/src/github.com/portainer/portainer

cp -r `ls -A | grep -v "src"` api/src/github.com/portainer/portainer/

ls -la api/src/github.com/portainer/portainer/

cd 'api/cmd/portainer'

pwd

go get -t -d -v ./...
GOOS=$1 GOARCH=$2 CGO_ENABLED=0 go build -a --installsuffix cgo --ldflags '-s'

mv "$AGENT_BUILDDIRECTORY/api/cmd/portainer/$binary" "$AGENT_BUILDDIRECTORY/dist/portainer"
