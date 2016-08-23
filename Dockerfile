FROM centurylink/ca-certs

COPY dist /

VOLUME /data

EXPOSE 9000

ENTRYPOINT ["/ui-for-docker"]
