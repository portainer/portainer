// +build linux

package websocket

import (
	"net"
)

func createWinDial(host string) (net.Conn, error) {
	return nil, nil
}
