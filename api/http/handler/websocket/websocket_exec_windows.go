// +build windows

package websocket

import (
	"net"

	"github.com/Microsoft/go-winio"
)

func createWinDial(host string) (net.Conn, error) {
	return winio.DialPipe(host, nil)
}
