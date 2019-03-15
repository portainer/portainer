param (
  [string]$platform,
  [string]$arch
)

$ErrorActionPreference = "Stop";

$binary = "portainer.exe"
$go_path = (Get-ITEM -Path env:AGENT_HOMEDIRECTORY).Value

Set-Item env:GOPATH "$go_path\api"

New-Item -Name dist -Path "$go_path" -ItemType Directory | Out-Null
New-Item -Name portainer -Path "$go_path\api\src\github.com\" -ItemType Directory | Out-Null

Copy-Item -Path "api" -Destination "$go_path\api\src\github.com\portainer" -Recurse -Force -ErrorAction:SilentlyContinue
Rename-Item -Path "$go_path\api\src\github.com\portainer\api" -NewName "portainer" -ErrorAction:SilentlyContinue

Set-Location -Path "$go_path\api\cmd\portainer"

go.exe get -t -d -v ./...
go.exe build -v

Move-Item -Path "$go_path\api\cmd\portainer\$($binary)" -Destination "$go_path\dist"
