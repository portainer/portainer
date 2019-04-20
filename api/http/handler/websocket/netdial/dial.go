// +build !windows

package netdial

import (
	"net"
)

func createDial(scheme, host string) (net.Conn, error) {
	return net.Dial(scheme, host)
}
