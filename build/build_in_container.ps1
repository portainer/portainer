param (
  [string]$platform,
  [string]$arch
)

$binary = "portainer-$($platform)-$($arch)"

New-Item -Name dist -Path "C:\projects\portainer" -ItemType Directory
New-Item -Name portainer -ItemType Directory -Path "C:\projects\portainer\api\src\github.com\portainer"

ls "C:\projects\portainer"
ls "C:\projects\portainer\api"

docker run -e CGO_ENABLED=0 -e GOPATH=C:\gopath -v "C:\projects\portainer\api:C:\gopath" -w C:\gopath\cmd\portainer golang:1.10.4-windowsservercore-ltsc2016 go get -t -d -v ./...; go build -v

Move-Item -Path "C:\projects\portainer\api\cmd\portainer\$($binary)" -Destination "C:\projects\portainer\dist"
