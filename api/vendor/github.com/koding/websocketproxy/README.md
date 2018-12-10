# WebsocketProxy [![GoDoc](https://godoc.org/github.com/koding/websocketproxy?status.svg)](https://godoc.org/github.com/koding/websocketproxy) [![Build Status](https://travis-ci.org/koding/websocketproxy.svg)](https://travis-ci.org/koding/websocketproxy)

WebsocketProxy is an http.Handler interface build on top of
[gorilla/websocket](https://github.com/gorilla/websocket) that you can plug
into your existing Go webserver to provide WebSocket reverse proxy.

## Install

```bash
go get github.com/koding/websocketproxy
```

## Example

Below is a simple server that proxies to the given backend URL

```go
package main

import (
	"flag"
	"net/http"
	"net/url"

	"github.com/koding/websocketproxy"
)

var (
	flagBackend = flag.String("backend", "", "Backend URL for proxying")
)

func main() {
	u, err := url.Parse(*flagBackend)
	if err != nil {
		log.Fatalln(err)
	}

	err = http.ListenAndServe(":80", websocketproxy.NewProxy(u))
	if err != nil {
		log.Fatalln(err)
	}
}
```

Save it as `proxy.go` and run as:

```bash
go run proxy.go -backend ws://example.com:3000
```

Now all incoming WebSocket requests coming to this server will be proxied to
`ws://example.com:3000`


