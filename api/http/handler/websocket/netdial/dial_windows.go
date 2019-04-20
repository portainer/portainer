// +build windows

package netdial

import (
	"net"
)

func createDial(scheme, host string) (net.Conn, error) {
	if scheme == "npipe" {
		return winio.DialPipe(host, nil)
	}
	return net.Dial(scheme, host)
}
