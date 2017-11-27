FROM golang:alpine
RUN echo "http://dl-cdn.alpinelinux.org/alpine/edge/community" >> /etc/apk/repositories && apk add -U --no-cache git upx
