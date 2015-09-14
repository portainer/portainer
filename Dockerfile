FROM scratch

COPY dist /

EXPOSE 9000
ENTRYPOINT ["/dockerui"]
