param (
  [string]$platform,
  [string]$arch
)

$binary = "portainer-$($platform)-$($arch)"

New-Item -Name dist -Path "C:\projects\portainer" -ItemType Directory

ls "C:\projects\portainer"
ls "C:\projects\portainer\api"

docker run -e CGO_ENABLED=0 -v "C:\projects\portainer\api:C:\gopath" -w C:\gopath\cmd\portainer golang:1.10.4-windowsservercore-ltsc2016 ls C:\gopath; ls C:\gopath\cmd\portainer; ls C:\gopath\src; go get -t -d -v ./...; go build -v

Move-Item -Path "C:\projects\portainer\api\cmd\portainer\$($binary)" -Destination "C:\projects\portainer\dist"
