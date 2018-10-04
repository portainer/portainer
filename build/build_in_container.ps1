param (
  [string]$platform,
  [string]$arch
)

$ErrorActionPreference = "Stop";

$binary = "portainer.exe"

Set-Item env:GOPATH "C:\projects\portainer\api"

New-Item -Name dist -Path "C:\projects\portainer" -ItemType Directory | Out-Null
New-Item -Name portainer -Path "C:\projects\portainer\api\src\github.com\" -ItemType Directory | Out-Null

Copy-Item -Path "C:\projects\portainer\api" -Destination "C:\projects\portainer\api\src\github.com\portainer" -Recurse -Force -ErrorAction:SilentlyContinue
Rename-Item -Path "C:\projects\portainer\api\src\github.com\portainer\api" -NewName "portainer" -ErrorAction:SilentlyContinue

Set-Location -Path "C:\projects\portainer\api\cmd\portainer"

C:\go\bin\go.exe get -t -d -v ./...
C:\go\bin\go.exe build -v

Move-Item -Path "C:\projects\portainer\api\cmd\portainer\$($binary)" -Destination "C:\projects\portainer\dist"