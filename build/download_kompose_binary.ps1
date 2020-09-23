param (
  [string]$kompose_version
)

$ErrorActionPreference = "Stop";

New-Item -Path "kompose-binary" -ItemType Directory | Out-Null

$download_folder = "kompose-binary"

Invoke-WebRequest -O "$($download_folder)/kompose.exe" "https://github.com/kubernetes/kompose/releases/download/$($kompose_version)/kompose-windows-amd64.exe"
Move-Item -Path "$($download_folder)/kubectl.exe" -Destination "dist"