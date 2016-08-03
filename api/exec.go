package main

import (
	"golang.org/x/net/websocket"
	"log"
)

// execContainer is used to create a websocket communication with an exec instance
func (a *api) execContainer(ws *websocket.Conn) {
	qry := ws.Request().URL.Query()
	execID := qry.Get("id")

	var host string
	if a.endpoint.Scheme == "tcp" {
		host = a.endpoint.Host
	} else if a.endpoint.Scheme == "unix" {
		host = a.endpoint.Path
	}

	if err := hijack(host, a.endpoint.Scheme, "POST", "/exec/"+execID+"/start", a.tlsConfig, true, ws, ws, ws, nil, nil); err != nil {
		log.Fatalf("error during hijack: %s", err)
		return
	}
}
