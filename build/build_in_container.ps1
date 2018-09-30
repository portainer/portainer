param (
  [string]$platform,
  [string]$arch
)

$binary = "portainer-$($platform)-$($arch)"

New-Item -Name dist -ItemType Directory | Out-Null

docker run --rm -e CGO_ENABLED=0 -v "$PWD/api/cmd/portainer":C:\gopath golang:1.9-nanoserver go build -v

Move-Item -Path ".\api\cmd\portainer\$($binary)" -Destination dist/
