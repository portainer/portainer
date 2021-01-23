FROM mcr.microsoft.com/windows/servercore:ltsc2019 as core

ENV GIT_VERSION 2.30.0
ENV GIT_PATCH_VERSION 2

RUN powershell -Command $ErrorActionPreference = 'Stop' ; \
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 ; \
    Invoke-WebRequest $('https://github.com/git-for-windows/git/releases/download/v{0}.windows.{1}/MinGit-{0}.{1}-busybox-64-bit.zip' -f $env:GIT_VERSION, $env:GIT_PATCH_VERSION) -OutFile 'mingit.zip' -UseBasicParsing ; \
    Expand-Archive mingit.zip -DestinationPath c:\mingit

FROM mcr.microsoft.com/windows/nanoserver:1809-amd64

USER ContainerAdministrator

COPY --from=core /windows/system32/netapi32.dll /windows/system32/netapi32.dll
COPY --from=core /mingit /mingit

COPY dist /

RUN setx /M path "%path%;C:\mingit\cmd"

WORKDIR /

EXPOSE 9000
EXPOSE 8000

ENTRYPOINT ["/portainer.exe"]
