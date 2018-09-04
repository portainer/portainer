FROM microsoft/nanoserver

USER ContainerAdministrator

COPY dist /

VOLUME C:\\data

WORKDIR /

EXPOSE 9000

ENTRYPOINT ["/portainer.exe"]
