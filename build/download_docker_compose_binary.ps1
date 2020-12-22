param (
  [string]$docker_compose_version
)

$ErrorActionPreference = "Stop";

Invoke-WebRequest -O "dist/docker-compose.exe" "https://github.com/docker/compose/releases/download/$($docker_compose_version)/docker-compose-Windows-x86_64.exe"
