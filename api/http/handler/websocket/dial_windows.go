//go:build windows
// +build windows

package websocket

import (
	"github.com/Microsoft/go-winio"
	"net"
)

func createDial(scheme, host string) (net.Conn, error) {
	if scheme == "npipe" {
		return winio.DialPipe(host, nil)
	}
	return net.Dial(scheme, host)
}
