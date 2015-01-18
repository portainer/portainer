FROM crosbymichael/golang

COPY dockerui.go /app/
COPY dist/ /app/
WORKDIR /app/
RUN go build dockerui.go
EXPOSE 9000
ENTRYPOINT ["./dockerui"]
