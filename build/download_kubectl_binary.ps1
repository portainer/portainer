param (
  [string]$kubectl_version
)

$ErrorActionPreference = "Stop";
$ProgressPreference = "SilentlyContinue";

Invoke-WebRequest -O "dist/kubectl.exe" "https://storage.googleapis.com/kubernetes-release/release/$($kubectl_version)/bin/windows/amd64/kubectl.exe"
