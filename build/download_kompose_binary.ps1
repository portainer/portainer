param (
  [string]$kompose_version
)

$ErrorActionPreference = "Stop";
$ProgressPreference = "SilentlyContinue";

Invoke-WebRequest -O "dist/kompose.exe" "https://github.com/kubernetes/kompose/releases/download/$($kompose_version)/kompose-windows-amd64.exe"
