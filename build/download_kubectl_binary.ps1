param (
  [string]$kubectl_version
)

$ErrorActionPreference = "Stop";

New-Item -Path "kubectl-binary" -ItemType Directory | Out-Null

$download_folder = "kubectl-binary"

Invoke-WebRequest -O "$($download_folder)/kubectl.exe" "https://storage.googleapis.com/kubernetes-release/release/$($kubectl_version)/bin/windows/amd64/kubectl.exe"
Move-Item -Path "$($download_folder)/kubectl.exe" -Destination "dist"
