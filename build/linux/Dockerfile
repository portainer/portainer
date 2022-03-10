FROM portainer/base

LABEL org.opencontainers.image.title="Portainer" \
    org.opencontainers.image.description="Rich container management experience using Portainer." \
    org.opencontainers.image.vendor="Portainer.io" \
    com.docker.desktop.extension.api.version=">= 0.2.0" \
    com.docker.desktop.extension.icon=https://portainer-io-assets.sfo2.cdn.digitaloceanspaces.com/logos/portainer.png

COPY dist /
COPY docker-extension/build /

VOLUME /data
WORKDIR /

EXPOSE 9000
EXPOSE 9443
EXPOSE 8000

ENTRYPOINT ["/portainer"]
