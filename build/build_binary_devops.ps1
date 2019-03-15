param (
  [string]$platform,
  [string]$arch
)

$ErrorActionPreference = "Stop";

$binary = "portainer.exe"
$go_path = "$($(Get-ITEM -Path env:AGENT_HOMEDIRECTORY).Value)\go"

Set-Item env:GOPATH "$go_path"

New-Item -Name dist -Path "." -ItemType Directory | Out-Null
New-Item -Name portainer -Path "$go_path\src\github.com\" -ItemType Directory | Out-Null

Copy-Item -Path "api" -Destination "$go_path\src\github.com\portainer" -Recurse -Force -ErrorAction:SilentlyContinue
Rename-Item -Path "$go_path\src\github.com\portainer\api" -NewName "portainer" -ErrorAction:SilentlyContinue

Set-Location -Path "api\cmd\portainer"

go.exe get -t -d -v ./...
go.exe build -v

Move-Item -Path "$($binary)" -Destination "dist"
