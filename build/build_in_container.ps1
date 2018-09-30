param (
  [string]$platform,
  [string]$arch
)

$binary = "portainer-$($platform)-$($arch)"

New-Item -Name dist -Path -ItemType Directory | Out-Null
New-Item -Name portainer -ItemType Directory -Path C:\gopath\src\github.com\portainer | Out-Null

ls C:\projects\portainer
ls C:\gopath\

#docker run -e CGO_ENABLED=0 -e GOPATH=C:\gopath -v "$PWD\api:C:\gopath" -w C:\gopath\cmd\portainer golang:1.10.4-windowsservercore-ltsc2016 go get -t -d -v ./...; go build -v

#Move-Item -Path "$PWD\api\cmd\portainer\$($binary)" -Destination dist/
