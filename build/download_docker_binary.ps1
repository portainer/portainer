param (
  [string]$docker_version,
  [string]$docker_base_version
)

$ErrorActionPreference = "Stop";

New-Item -Path "docker-binary" -ItemType Directory | Out-Null

$download_folder = "docker-binary"

# Invoke-WebRequest -O "$($download_folder)/docker-binaries.zip" "https://download.docker.com/win/static/stable/x86_64/docker-$($docker_version).zip"
Invoke-WebRequest -O "$($download_folder)/docker-binaries.zip" "https://download.docker.com/components/engine/windows-server/$($docker_base_version)/docker-$($docker_version).zip"
Expand-Archive -Path "$($download_folder)/docker-binaries.zip" -DestinationPath "$($download_folder)"
Move-Item -Path "$($download_folder)/docker/docker.exe" -Destination "dist"