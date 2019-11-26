param (
  [string]$platform,
  [string]$arch
)

$ErrorActionPreference = "Stop";

$binary = "portainer.exe"
$go_path = "$($(Get-ITEM -Path env:AGENT_TEMPDIRECTORY).Value)\go"

Set-Item env:GOPATH "$go_path"

New-Item -Name dist -Path "." -ItemType Directory -Force | Out-Null
New-Item -Name portainer -Path "$go_path\src\github.com\portainer" -ItemType Directory -Force | Out-Null

Copy-Item -Path "api" -Destination "$go_path\src\github.com\portainer\portainer\api" -Recurse -Force -ErrorAction:SilentlyContinue

Set-Location -Path "api\cmd\portainer"

go get -t -d -v ./...
## go build -v
& cmd /c 'go build -v 2>&1'

Copy-Item -Path "portainer.exe" -Destination "$($env:BUILD_SOURCESDIRECTORY)\dist\portainer.exe" -Force -ErrorAction:SilentlyContinue
