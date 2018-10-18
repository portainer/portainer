param (
  [string]$platform,
  [string]$arch
)

$ErrorActionPreference = "Stop";

$binary = "portainer.exe"

Set-Item env:GOPATH ".\api\"

New-Item -Name dist -Path "." -ItemType Directory | Out-Null
New-Item -Name portainer -Path "api\src\github.com\" -ItemType Directory | Out-Null

Copy-Item -Path "api" -Destination "api\src\github.com\portainer" -Recurse -Force -ErrorAction:SilentlyContinue
Rename-Item -Path "api\src\github.com\portainer\api" -NewName "portainer" -ErrorAction:SilentlyContinue

Set-Location -Path "api\cmd\portainer"

C:\go\bin\go.exe get -t -d -v ./...
C:\go\bin\go.exe build -v

Move-Item -Path "api\cmd\portainer\$($binary)" -Destination "dist"