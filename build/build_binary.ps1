param (
  [string]$platform,
  [string]$arch
)

$ErrorActionPreference = "Stop";

$binary = "portainer.exe"
$project_path = $((Get-Location).Path)

New-Item -Name dist -Path "$project_path" -ItemType Directory | Out-Null
Set-Location -Path "$project_path\api\cmd\portainer"

C:\go\bin\go.exe get -t -d -v ./...
C:\go\bin\go.exe build -v

Move-Item -Path "$($binary)" -Destination "..\..\..\dist"
