package libhttp

import (
	"net"
	"net/http"
)

// IsLocalRequest returns true when the request originates from the local host.
// It accepts both loopback requests and self-dials to the listener's bound IP.
func IsLocalRequest(r *http.Request) bool {
	remoteIP := ParseRequestIP(r.RemoteAddr)
	if remoteIP == nil {
		return false
	}

	if remoteIP.IsLoopback() {
		return true
	}

	localAddr, ok := r.Context().Value(http.LocalAddrContextKey).(net.Addr)
	if !ok {
		return false
	}

	localIP := ParseRequestIP(localAddr.String())
	if localIP == nil {
		return false
	}

	return remoteIP.Equal(localIP)
}

// ParseRequestIP extracts the IP address from a host:port address string.
func ParseRequestIP(addr string) net.IP {
	host, _, err := net.SplitHostPort(addr)
	if err != nil {
		return nil
	}

	return net.ParseIP(host)
}
