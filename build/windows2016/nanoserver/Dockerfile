ARG IMAGE_TAG=mcr.microsoft.com/windows/nanoserver:1903

FROM ${IMAGE_TAG}

COPY dist /

VOLUME C:\\data

WORKDIR /

EXPOSE 9000

ENTRYPOINT ["/portainer.exe"]
