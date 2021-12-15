//go:build !windows
// +build !windows

package websocket

import (
	"net"
)

func createDial(scheme, host string) (net.Conn, error) {
	return net.Dial(scheme, host)
}
