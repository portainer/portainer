param (
  [string]$platform,
  [string]$arch
)

$binary = "portainer-$($platform)-$($arch)"

New-Item -Name dist -ItemType Directory

docker run --rm -tv "$(pwd)\api:/src" -e BUILD_GOOS="$($platform)" -e BUILD_GOARCH="$($arch)" portainer/golang-builder:cross-platform /src/cmd/portainer

Move-Item -Path ".\api\cmd\portainer\$($binary)" -Destination dist/

(Get-FileHash ".\$($binary)").Hash > portainer-checksum.txt
