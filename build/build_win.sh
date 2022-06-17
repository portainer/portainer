set -x

mkdir -p dist

cd api
# the go get adds 8 seconds
go get -t -d -v ./...

# the build takes 2 seconds
GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build \
	--installsuffix cgo \
	--ldflags '-s' \
	-o "../dist/portainer.exe" \
	./cmd/portainer/
