param (
  [string]$docker_version
)

$ErrorActionPreference = "Stop";

New-Item -Path "docker-binary" -ItemType Directory | Out-Null

$download_folder = "docker-binary"
$docker_base_version = $docker_version.Split(".")[0] + "." + $docker_version.Split(".")[1]

Invoke-WebRequest -O "$($download_folder)/docker-binaries.zip" "https://download.docker.com/components/engine/windows-server/$($docker_base_version)/docker-$($docker_version).zip"
Expand-Archive -Path "$($download_folder)/docker-binaries.zip" -DestinationPath "$($download_folder)"
Move-Item -Path "$($download_folder)/docker/docker.exe" -Destination "dist"