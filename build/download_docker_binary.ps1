param (
  [string]$docker_version
)

$ErrorActionPreference = "Stop";
$ProgressPreference = "SilentlyContinue";

New-Item -Path "docker-binary" -ItemType Directory | Out-Null

$download_folder = "docker-binary"

Invoke-WebRequest -O "$($download_folder)/docker-binaries.zip" "https://dockermsft.azureedge.net/dockercontainer/docker-$($docker_version).zip"
Expand-Archive -Path "$($download_folder)/docker-binaries.zip" -DestinationPath "$($download_folder)"
Move-Item -Path "$($download_folder)/docker/docker.exe" -Destination "dist"
Move-Item -Path "$($download_folder)/docker/*.dll" -Destination "dist"
