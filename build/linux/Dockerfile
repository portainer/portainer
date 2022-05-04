FROM portainer/base

LABEL org.opencontainers.image.title="Portainer" \
  org.opencontainers.image.description="Rich container management experience using Portainer." \
  org.opencontainers.image.vendor="Portainer.io" \
  com.docker.desktop.extension.api.version=">= 0.2.2" \
  com.docker.desktop.extension.icon="https://portainer-io-assets.sfo2.cdn.digitaloceanspaces.com/logos/portainer.png" \
  com.docker.extension.screenshots="[{\"alt\": \"our company logo\", \"url\": \"https://portainer-io-assets.sfo2.cdn.digitaloceanspaces.com/logos/portainer.png\"}]" \
  com.docker.extension.detailed-description="This is an example description for the extension" \
  com.docker.extension.publisher-url="https://www.portainer.io"

COPY dist /
COPY build/docker-extension /

VOLUME /data
WORKDIR /

EXPOSE 9000
EXPOSE 9443
EXPOSE 8000

ENTRYPOINT ["/portainer"]
