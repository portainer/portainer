FROM alpine

ENV ARCHIVE_BUILD_FOLDER ''
ENV WORKDIR '/work/'

WORKDIR /portainer-build

ADD portainer-godeps.tar /portainer-deps/
COPY bootstrap.sh /usr/bin/bootstrap
COPY ansi_color.sh /etc/profile.d/
COPY package.json /portainer/

RUN echo "http://dl-cdn.alpinelinux.org/alpine/edge/main" >> /etc/apk/repositories \
 && echo "http://dl-cdn.alpinelinux.org/alpine/edge/testing" >> /etc/apk/repositories \
 && echo "http://dl-cdn.alpinelinux.org/alpine/edge/community" >> /etc/apk/repositories \
 && apk add -U --no-cache ca-certificates wget perl-utils nodejs yarn git tree dos2unix rsync \
 && dos2unix /usr/bin/bootstrap \
 && dos2unix /etc/profile.d/ansi_color.sh \
 && cd /portainer \
 && dos2unix $(ls) \
 && yarn install && mv node_modules /portainer-deps/ \
 && apk del git yarn \
 && cd .. && rm -rf portainer /var/cache/apk/* ~/.cache/* /tmp/* \
 && chmod +x /usr/bin/bootstrap \
 && mv /etc/profile.d/color_prompt /etc/profile.d/color_prompt.sh \
 && ln -s /portainer-deps/node_modules/grunt-cli/bin/grunt /usr/bin/grunt

ENTRYPOINT ["bootstrap"]

CMD ["vV"]
