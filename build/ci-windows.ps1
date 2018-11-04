$ErrorActionPreference = "Stop";

$pull_request_number = $ENV:APPVEYOR_PULL_REQUEST_NUMBER
$branch_name = $ENV:APPVEYOR_REPO_BRANCH
$os = (Get-Item ENV:IMAGE).Value
$arch = (Get-Item ENV:ARCH).Value

if ($pull_request_number) {
  $tag = "pr$($pull_request_number)-$($os)-$($arch)"
  $tag_1709 = "pr$($pull_request_number)-$($os)1709-$($arch)"
  $tag_1803 = "pr$($pull_request_number)-$($os)1803-$($arch)"
} else {
  $tag = "$($branch_name)-$($os)-$($arch)"
  $tag_1709 = "$($branch_name)-$($os)1709-$($arch)"
  $tag_1803 = "$($branch_name)-$($os)1803-$($arch)"
}

docker build `
  -t ssbkang/portainer:$tag `
  -f build\windows2016\nanoserver\Dockerfile .
    
docker login `
  -u "$((Get-Item ENV:DOCKER_USER).Value)" `
  -p "$((Get-Item ENV:DOCKER_PASS).Value)"
  
docker push ssbkang/portainer:$tag

rebase-docker-image `
  ssbkang/portainer:$tag `
  -t ssbkang/portainer:$tag_1709 `
  -b microsoft/nanoserver:1709
    
rebase-docker-image `
  ssbkang/portainer:$tag `
  -t ssbkang/portainer:$tag_1803 `
  -b microsoft/nanoserver:1803