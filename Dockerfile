FROM scratch

COPY dockerui /
COPY dist /

EXPOSE 9000
ENTRYPOINT ["/dockerui"]
