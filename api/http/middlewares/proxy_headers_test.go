package middlewares

import (
	"net/http/httptest"
	"testing"

	"github.com/portainer/portainer/pkg/libhttp"

	"github.com/stretchr/testify/require"
)

var tests = []struct {
	name      string
	forwarded string
	expected  string
}{
	{
		name:      "empty header",
		forwarded: "",
		expected:  "",
	},
	{
		name:      "single proxy with proto=https",
		forwarded: "proto=https",
		expected:  "https",
	},
	{
		name:      "single proxy with proto=http",
		forwarded: "proto=http",
		expected:  "http",
	},
	{
		name:      "single proxy with multiple directives",
		forwarded: "for=192.0.2.60;proto=https;by=203.0.113.43",
		expected:  "https",
	},
	{
		name:      "single proxy with proto in middle",
		forwarded: "for=192.0.2.60;proto=https;host=example.com",
		expected:  "https",
	},
	{
		name:      "single proxy with proto at end",
		forwarded: "for=192.0.2.60;host=example.com;proto=https",
		expected:  "https",
	},
	{
		name:      "multiple proxies - takes last",
		forwarded: "proto=https, proto=http",
		expected:  "http",
	},
	{
		name:      "multiple proxies with complex format",
		forwarded: "for=192.0.2.43;proto=https, for=198.51.100.17;proto=http",
		expected:  "http",
	},
	{
		name:      "multiple proxies with for directive only",
		forwarded: "for=192.0.2.43, for=198.51.100.17",
		expected:  "",
	},
	{
		name:      "multiple proxies with proto only in second",
		forwarded: "for=192.0.2.43, proto=https",
		expected:  "https",
	},
	{
		name:      "multiple proxies with proto only in first",
		forwarded: "proto=https, for=198.51.100.17",
		expected:  "",
	},
	{
		name:      "quoted protocol value",
		forwarded: "proto=\"https\"",
		expected:  "https",
	},
	{
		name:      "single quoted protocol value",
		forwarded: "proto='https'",
		expected:  "https",
	},
	{
		name:      "mixed case protocol",
		forwarded: "proto=HTTPS",
		expected:  "HTTPS",
	},
	{
		name:      "no proto directive",
		forwarded: "for=192.0.2.60;by=203.0.113.43",
		expected:  "",
	},
	{
		name:      "empty proto value",
		forwarded: "proto=",
		expected:  "",
	},
	{
		name:      "whitespace around values",
		forwarded: " proto = https ",
		expected:  "https",
	},
	{
		name:      "whitespace around semicolons",
		forwarded: "for=192.0.2.60 ; proto=https ; by=203.0.113.43",
		expected:  "https",
	},
	{
		name:      "whitespace around commas",
		forwarded: "proto=https , proto=http",
		expected:  "http",
	},
	{
		name:      "IPv6 address in for directive",
		forwarded: "for=\"[2001:db8:cafe::17]:4711\";proto=https",
		expected:  "https",
	},
	{
		name:      "complex multiple proxies with IPv6",
		forwarded: "for=192.0.2.43;proto=https, for=\"[2001:db8:cafe::17]\";proto=http",
		expected:  "http",
	},
	{
		name:      "obfuscated identifiers",
		forwarded: "for=_mdn;proto=https",
		expected:  "https",
	},
	{
		name:      "unknown identifier",
		forwarded: "for=unknown;proto=https",
		expected:  "https",
	},
	{
		name:      "malformed key-value pair",
		forwarded: "proto",
		expected:  "",
	},
	{
		name:      "malformed key-value pair with equals",
		forwarded: "proto=",
		expected:  "",
	},
	{
		name:      "multiple equals signs",
		forwarded: "proto=https=extra",
		expected:  "https=extra",
	},
	{
		name:      "mixed case directive name",
		forwarded: "PROTO=https",
		expected:  "https",
	},
	{
		name:      "mixed case directive name with spaces",
		forwarded: " Proto = https ",
		expected:  "https",
	},
}

func TestParseForwardedHeaderProto(t *testing.T) {
	t.Parallel()
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := parseForwardedHeaderProto(tt.forwarded)
			if result != tt.expected {
				t.Errorf("parseForwardedHeader(%q) = %q, want %q", tt.forwarded, result, tt.expected)
			}
		})
	}
}

func FuzzParseForwardedHeaderProto(f *testing.F) {
	for _, t := range tests {
		f.Add(t.forwarded)
	}

	f.Fuzz(func(t *testing.T, forwarded string) {
		parseForwardedHeaderProto(forwarded)
	})
}

func TestIsHTTPSRequest(t *testing.T) {
	t.Parallel()

	f := func(trustedProxyEntries []string, remoteAddr, xForwardedProto, forwarded string, want bool) {
		t.Helper()

		trustedProxies, err := libhttp.ParseTrustedProxies(trustedProxyEntries)
		require.NoError(t, err)

		req := httptest.NewRequest("GET", "/", nil)
		req.RemoteAddr = remoteAddr

		if xForwardedProto != "" {
			req.Header.Set("X-Forwarded-Proto", xForwardedProto)
		}

		if forwarded != "" {
			req.Header.Set("Forwarded", forwarded)
		}

		require.Equal(t, want, IsHTTPSRequest(req, trustedProxies))
	}

	// no trusted proxies configured, header is honoured unconditionally
	f(nil, "203.0.113.99:12345", "https", "", true)

	// trusted proxy, rightmost X-Forwarded-Proto entry is used
	f([]string{"127.0.0.1/32"}, "127.0.0.1:54321", "http, https", "", true)

	// trusted proxy, falls back to the Forwarded header
	f([]string{"127.0.0.1/32"}, "127.0.0.1:54321", "", "proto=http, proto=https", true)

	// untrusted peer, spoofed header is ignored
	f([]string{"10.0.0.1/32"}, "203.0.113.99:12345", "https", "", false)
}
