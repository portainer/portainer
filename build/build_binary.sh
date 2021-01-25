binary="portainer"
mkdir -p dist

cd 'api/cmd/portainer'

go get -t -d -v ./...
GOOS=$1 GOARCH=$2 CGO_ENABLED=0 go build -a --installsuffix cgo --ldflags "-s -X github.com/portainer/liblicense.LicenseServerBaseURL=https://api.portainer.io"

mv "${binary}" "../../../dist/portainer"