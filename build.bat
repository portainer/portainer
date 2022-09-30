set GOARCH=amd64
set GOOS=linux
go build -o dist/portainer api/cmd/portainer/main.go