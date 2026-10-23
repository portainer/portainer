package middlewares

import (
	"net"
	"net/http"
	"strings"

	"github.com/portainer/portainer/pkg/libhttp"
)

// parseForwardedHeaderProto extracts the proto= parameter of the rightmost
// element of a Forwarded header value (RFC 7239).
func parseForwardedHeaderProto(forwarded string) string {
	if forwarded == "" {
		return ""
	}

	proto, _ := libhttp.ForwardedElementParam(libhttp.LastCommaSeparated(forwarded), "proto")

	return proto
}

// IsHTTPSRequest checks if the original request was made over HTTPS by
// examining the rightmost entry of the X-Forwarded-Proto header, falling
// back to the rightmost proto= parameter of the Forwarded header. If
// trustedProxies is empty, both headers are honoured unconditionally,
// preserving existing behaviour for deployments that have not configured a
// trusted proxy list; once it is set, the headers are only honoured when
// the immediate peer (r.RemoteAddr) matches one of them.
func IsHTTPSRequest(r *http.Request, trustedProxies []*net.IPNet) bool {
	if len(trustedProxies) > 0 {
		peer := libhttp.ParseRequestIP(r.RemoteAddr)
		if peer == nil || !libhttp.IsTrustedProxy(peer, trustedProxies) {
			return false
		}
	}

	xForwardedProto := libhttp.LastCommaSeparated(r.Header.Get("X-Forwarded-Proto"))

	return strings.EqualFold(xForwardedProto, "https") ||
		strings.EqualFold(parseForwardedHeaderProto(r.Header.Get("Forwarded")), "https")
}
