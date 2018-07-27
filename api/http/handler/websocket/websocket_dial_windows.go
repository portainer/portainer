// +build windows

package websocket

import (
	"net"

	"github.com/Microsoft/go-winio"
)

func createDial(scheme, host string) (net.Conn, error) {
	if scheme == "npipe" {
		return winio.DialPipe(host, nil)
	}
	return net.Dial(scheme, host)
}
