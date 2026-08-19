package libhttp

import (
	"fmt"
	"net"
	"net/http"
	"slices"
	"strings"
)

// ParseTrustedProxies parses a list of IP addresses and/or CIDR ranges into
// the networks ClientIP uses to decide whether forwarding headers on an
// incoming request may be trusted, treating a bare IP address as a single host.
func ParseTrustedProxies(entries []string) ([]*net.IPNet, error) {
	nets := make([]*net.IPNet, 0, len(entries))

	for _, entry := range entries {
		entry = strings.TrimSpace(entry)
		if entry == "" {
			continue
		}

		if _, ipNet, err := net.ParseCIDR(entry); err == nil {
			nets = append(nets, ipNet)
			continue
		}

		ip := net.ParseIP(entry)
		if ip == nil {
			return nil, fmt.Errorf("invalid trusted proxy address: %q", entry)
		}

		bits := 32
		if ip.To4() == nil {
			bits = 128
		}

		nets = append(nets, &net.IPNet{IP: ip, Mask: net.CIDRMask(bits, bits)})
	}

	return nets, nil
}

// ClientIP returns the IP address of the client that originated the request.
// The TCP peer address (r.RemoteAddr) is used when the request arrives
// directly from the client. When the peer matches one of trustedProxies,
// the client IP comes from the rightmost entry of the X-Forwarded-For
// header instead, falling back to the rightmost for= parameter of the
// Forwarded header, since the trusted proxy's own contribution to either
// header always ends up last, whether it replaced the header outright or
// appended its view of the client to whatever it received.
func ClientIP(r *http.Request, trustedProxies []*net.IPNet) string {
	peer := ParseRequestIP(r.RemoteAddr)
	if peer == nil {
		return r.RemoteAddr
	}

	if !IsTrustedProxy(peer, trustedProxies) {
		return peer.String()
	}

	if forwarded, ok := lastForwardedFor(r.Header.Get("X-Forwarded-For")); ok {
		return forwarded
	}

	if forwarded, ok := lastForwardedHeaderFor(r.Header.Get("Forwarded")); ok {
		return forwarded
	}

	return peer.String()
}

// IsTrustedProxy reports whether ip is contained in one of trustedProxies.
func IsTrustedProxy(ip net.IP, trustedProxies []*net.IPNet) bool {
	return slices.ContainsFunc(trustedProxies, func(trustedProxy *net.IPNet) bool {
		return trustedProxy.Contains(ip)
	})
}

// lastForwardedFor extracts the rightmost entry from an X-Forwarded-For
// header value.
func lastForwardedFor(xff string) (string, bool) {
	if xff == "" {
		return "", false
	}

	return parseForwardedIP(LastCommaSeparated(xff))
}

// lastForwardedHeaderFor extracts the for= parameter of the rightmost
// forwarded-element in a Forwarded header value (RFC 7239).
func lastForwardedHeaderFor(forwarded string) (string, bool) {
	if forwarded == "" {
		return "", false
	}

	value, ok := ForwardedElementParam(LastCommaSeparated(forwarded), "for")
	if !ok {
		return "", false
	}

	return parseForwardedIP(value)
}

// parseForwardedIP resolves a forwarding-header token to an IP address,
// accepting either a bare address or an address with a port as specified in
// RFC 7239.
func parseForwardedIP(token string) (string, bool) {
	token = strings.Trim(strings.TrimSpace(token), `"`)
	if token == "" {
		return "", false
	}

	if ip := net.ParseIP(token); ip != nil {
		return ip.String(), true
	}

	host, _, err := net.SplitHostPort(token)
	if err != nil {
		return "", false
	}

	ip := net.ParseIP(host)
	if ip == nil {
		return "", false
	}

	return ip.String(), true
}
