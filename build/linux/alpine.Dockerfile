FROM alpine:latest

COPY dist/docker /
COPY dist/docker-compose /
COPY dist/helm /
COPY dist/kompose /
COPY dist/kubectl /
COPY dist/mustache-templates /mustache-templates/
COPY dist/portainer /
COPY dist/public /public/

VOLUME /data
WORKDIR /

EXPOSE 9000
EXPOSE 9443
EXPOSE 8000

LABEL io.portainer.server true

ENTRYPOINT ["/portainer"]
