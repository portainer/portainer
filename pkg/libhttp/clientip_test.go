package libhttp

import (
	"net"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestClientIP(t *testing.T) {
	t.Parallel()

	f := func(trustedProxyEntries []string, remoteAddr, xForwardedFor, forwarded, want string) {
		t.Helper()

		trustedProxies, err := ParseTrustedProxies(trustedProxyEntries)
		require.NoError(t, err)

		req := httptest.NewRequest("POST", "/auth", nil)
		req.RemoteAddr = remoteAddr

		if xForwardedFor != "" {
			req.Header.Set("X-Forwarded-For", xForwardedFor)
		}

		if forwarded != "" {
			req.Header.Set("Forwarded", forwarded)
		}

		ip := ClientIP(req, trustedProxies)

		require.Equal(t, want, ip)
	}

	// no trusted proxies configured, headers are ignored
	f(nil, "127.0.0.1:54321", "203.0.113.5", "for=203.0.113.5", "127.0.0.1")

	// trusted proxy, X-Forwarded-For is used
	f([]string{"127.0.0.1/32"}, "127.0.0.1:54321", "10.0.0.1", "", "10.0.0.1")

	// trusted proxy, a client-supplied X-Forwarded-For prefix is ignored:
	// the proxy appends its own view of the connection (10.0.0.1) rather
	// than replacing it, so only that rightmost entry is trusted
	f([]string{"127.0.0.1/32"}, "127.0.0.1:54321", "203.0.113.5, 10.0.0.1", "", "10.0.0.1")

	// trusted proxy, falls back to the Forwarded header
	f([]string{"127.0.0.1/32"}, "127.0.0.1:54321", "", `for=198.51.100.17;proto=https, for="[2001:db8:cafe::17]:4711"`, "2001:db8:cafe::17")

	// trusted proxy, spoofed Forwarded prefix is ignored
	f([]string{"127.0.0.1/32"}, "127.0.0.1:54321", "", "for=1.2.3.4, for=10.0.0.1", "10.0.0.1")

	// trusted proxy, Forwarded header with a bare IP
	f([]string{"127.0.0.1/32"}, "127.0.0.1:54321", "", "for=203.0.113.9", "203.0.113.9")

	// trusted proxy, X-Forwarded-For takes precedence over Forwarded
	f([]string{"127.0.0.1/32"}, "127.0.0.1:54321", "203.0.113.5", "for=198.51.100.17", "203.0.113.5")

	// trusted proxy, malformed headers fall back to the peer
	f([]string{"127.0.0.1/32"}, "127.0.0.1:54321", "not-an-ip", "proto=https", "127.0.0.1")

	// untrusted peer, spoofed headers are ignored
	f([]string{"10.0.0.1/32"}, "203.0.113.99:54321", "1.2.3.4", "for=1.2.3.4", "203.0.113.99")
}

func TestParseTrustedProxies_CIDRAndBareIPEntries(t *testing.T) {
	t.Parallel()

	trustedProxies, err := ParseTrustedProxies([]string{"10.0.0.0/8", "192.168.1.1", "2001:db8::1", " "})
	require.NoError(t, err)
	require.Len(t, trustedProxies, 3)

	require.True(t, trustedProxies[0].Contains(mustParseIP(t, "10.1.2.3")))
	require.True(t, trustedProxies[1].Contains(mustParseIP(t, "192.168.1.1")))
	require.False(t, trustedProxies[1].Contains(mustParseIP(t, "192.168.1.2")))
	require.True(t, trustedProxies[2].Contains(mustParseIP(t, "2001:db8::1")))
}

func TestParseTrustedProxies_InvalidEntryReturnsError(t *testing.T) {
	t.Parallel()

	_, err := ParseTrustedProxies([]string{"not-an-ip-or-cidr"})

	require.Error(t, err)
}

func mustParseIP(t *testing.T, s string) net.IP {
	t.Helper()

	ip := net.ParseIP(s)
	require.NotNil(t, ip)

	return ip
}
