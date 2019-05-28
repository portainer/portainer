ARG IMAGE_TAG=1903

FROM microsoft/nanoserver:${IMAGE_TAG}

COPY dist /

VOLUME C:\\data

WORKDIR /

EXPOSE 9000

ENTRYPOINT ["/portainer.exe"]
