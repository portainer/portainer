package middlewares

import (
	"net/http"
	"strings"
)

// parseForwardedHeaderProto parses the Forwarded header and extracts the protocol.
// The Forwarded header format supports:
// - Single proxy: Forwarded: by=<identifier>;for=<identifier>;host=<host>;proto=<http|https>
// - Multiple proxies: Forwarded: for=192.0.2.43, for=198.51.100.17
// We take the first (leftmost) entry as it represents the original client
func parseForwardedHeaderProto(forwarded string) string {
	if forwarded == "" {
		return ""
	}

	// Parse the first part (leftmost proxy, closest to original client)
	firstPart, _, _ := strings.Cut(forwarded, ",")
	firstPart = strings.TrimSpace(firstPart)

	// Split by semicolon to get key-value pairs within this proxy entry
	// Format: key=value;key=value;key=value
	for pair := range strings.SplitSeq(firstPart, ";") {
		// Split by equals sign to separate key and value
		key, value, found := strings.Cut(pair, "=")
		if !found {
			continue
		}

		if strings.EqualFold(strings.TrimSpace(key), "proto") {
			return strings.Trim(strings.TrimSpace(value), `"'`)
		}
	}

	return ""
}

// IsHTTPSRequest checks if the original request was made over HTTPS
// by examining both X-Forwarded-Proto and Forwarded headers
func IsHTTPSRequest(r *http.Request) bool {
	return strings.EqualFold(r.Header.Get("X-Forwarded-Proto"), "https") ||
		strings.EqualFold(parseForwardedHeaderProto(r.Header.Get("Forwarded")), "https")
}
