FROM portainer/base

COPY dist /

VOLUME /data

WORKDIR /

EXPOSE 9000

ENTRYPOINT ["/portainer"]

HEALTHCHECK --start-period=10ms --interval=30s --timeout=5s --retries=3 CMD ["/portainer", "-c"]
