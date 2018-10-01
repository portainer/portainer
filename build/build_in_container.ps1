param (
  [string]$platform,
  [string]$arch
)

$binary = "portainer-$($platform)-$($arch)"

Set-Item env:GOPATH "C:\projects\portainer\api"

New-Item -Name dist -Path "C:\projects\portainer" -ItemType Directory
New-Item -Name portainer -Path "C:\projects\portainer\api\src\github.com\" -ItemType Directory

Copy-Item -Path "C:\projects\portainer\api" -Destination "C:\projects\portainer\api\src\github.com\portainer" -Recurse -Force
Rename-Item -Path "C:\projects\portainer\api\src\github.com\portainer\api" -NewName "portainer"

ls "C:\projects\portainer\api\src\github.com\portainer\portainer\"

Set-Location -Path "C:\projects\portainer\api\cmd\portainer"

C:\go\bin\go.exe get -t -d -v ./...
C:\go\bin\go.exe build -v

ls C:\projects\portainer\dist

#docker run -e CGO_ENABLED=0 -v "C:\projects\portainer\api:C:\gopath" -w C:\gopath\cmd\portainer golang:1.10.4-windowsservercore-ltsc2016 ls C:\gopath; ls C:\gopath\cmd\portainer; ls C:\gopath\src; go get -t -d -v ./...; go build -v

#Move-Item -Path "C:\projects\portainer\api\cmd\portainer\$($binary)" -Destination "C:\projects\portainer\dist"
