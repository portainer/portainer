$ErrorActionPreference = "Stop";

if ($ENV:APPVEYOR_PULL_REQUEST_NUMBER) {
    docker build `
        -t ssbkang/portainer:pr$ENV:APPVEYOR_PULL_REQUEST_NUMBER-$((Get-Item ENV:IMAGE).Value)-$((Get-Item ENV:ARCH).Value) `
        -f build\windows2016\nanoserver\Dockerfile .
        
    docker login `
        -u "$((Get-Item ENV:DOCKER_USER).Value)" `
        -p "$((Get-Item ENV:DOCKER_PASS).Value)"

    docker push ssbkang/portainer:pr$ENV:APPVEYOR_PULL_REQUEST_NUMBER-$((Get-Item ENV:IMAGE).Value)-$((Get-Item ENV:ARCH).Value)

    rebase-docker-image `
        ssbkang/portainer:pr$ENV:APPVEYOR_PULL_REQUEST_NUMBER-$((Get-Item ENV:IMAGE).Value)-$((Get-Item ENV:ARCH).Value) `
        -t ssbkang/portainer:pr$ENV:APPVEYOR_PULL_REQUEST_NUMBER-$((Get-Item ENV:IMAGE).Value)1709-$((Get-Item ENV:ARCH).Value) `
        -b microsoft/nanoserver:1709
        
    rebase-docker-image `
        ssbkang/portainer:pr$ENV:APPVEYOR_PULL_REQUEST_NUMBER-$((Get-Item ENV:IMAGE).Value)-$((Get-Item ENV:ARCH).Value) `
        -t ssbkang/portainer:pr$ENV:APPVEYOR_PULL_REQUEST_NUMBER-$((Get-Item ENV:IMAGE).Value)1803-$((Get-Item ENV:ARCH).Value) `
        -b microsoft/nanoserver:1803
} else {
    New-Item -Path portainer -ItemType Directory | Out-Null
    Copy-Item -Path dist\* -Destination portainer -Recurse
    tar cvpfz "portainer-$((Get-Item ENV:PORTAINER_VERSION).Value)-$((Get-Item ENV:IMAGE).Value)-$((Get-Item ENV:ARCH).Value).tar.gz" portainer

    docker build `
        -t ssbkang/portainer:$((Get-Item ENV:IMAGE).Value)-$((Get-Item ENV:ARCH).Value)-$((Get-Item ENV:PORTAINER_VERSION).Value) `
        -f build\windows2016\nanoserver\Dockerfile .
        
    docker tag ssbkang/portainer:$((Get-Item ENV:IMAGE).Value)-$((Get-Item ENV:ARCH).Value)-$((Get-Item ENV:PORTAINER_VERSION).Value) ssbkang/portainer:$((Get-Item ENV:IMAGE).Value)-$((Get-Item ENV:ARCH).Value)

    docker login `
        -u "$((Get-Item ENV:DOCKER_USER).Value)" `
        -p "$((Get-Item ENV:DOCKER_PASS).Value)"

    docker push ssbkang/portainer:$((Get-Item ENV:IMAGE).Value)-$((Get-Item ENV:ARCH).Value)-$((Get-Item ENV:PORTAINER_VERSION).Value)
    docker push ssbkang/portainer:$((Get-Item ENV:IMAGE).Value)-$((Get-Item ENV:ARCH).Value)

    rebase-docker-image `
        ssbkang/portainer:$((Get-Item ENV:IMAGE).Value)-$((Get-Item ENV:ARCH).Value) `
        -t ssbkang/portainer:$((Get-Item ENV:IMAGE).Value)1709-$((Get-Item ENV:ARCH).Value)-$((Get-Item ENV:PORTAINER_VERSION).Value) `
        -b microsoft/nanoserver:1709

    rebase-docker-image `
        ssbkang/portainer:$((Get-Item ENV:IMAGE).Value)-$((Get-Item ENV:ARCH).Value) `
        -t ssbkang/portainer:$((Get-Item ENV:IMAGE).Value)1709-$((Get-Item ENV:ARCH).Value) `
        -b microsoft/nanoserver:1709

    rebase-docker-image `
        ssbkang/portainer:$((Get-Item ENV:IMAGE).Value)-$((Get-Item ENV:ARCH).Value) `
        -t ssbkang/portainer:$((Get-Item ENV:IMAGE).Value)1803-$((Get-Item ENV:ARCH).Value)-$((Get-Item ENV:PORTAINER_VERSION).Value) `
        -b microsoft/nanoserver:1803

    rebase-docker-image `
        ssbkang/portainer:$((Get-Item ENV:IMAGE).Value)-$((Get-Item ENV:ARCH).Value) `
        -t ssbkang/portainer:$((Get-Item ENV:IMAGE).Value)1803-$((Get-Item ENV:ARCH).Value) `
        -b microsoft/nanoserver:1803
}