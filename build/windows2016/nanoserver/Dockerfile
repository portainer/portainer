FROM mcr.microsoft.com/windows/servercore:ltsc2019 as core
FROM microsoft/nanoserver:sac2016

COPY --from=core /windows/system32/netapi32.dll /windows/system32/netapi32.dll

COPY dist /

WORKDIR /

EXPOSE 9000
EXPOSE 8000

ENTRYPOINT ["/portainer.exe"]
