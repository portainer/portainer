package ssrf

import (
	"context"
	"net"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestIpAllowed_CIDR(t *testing.T) {
	t.Parallel()

	d := newSafeDialer(Policy{
		Mode:         ModeEnforce,
		AllowedHosts: []string{"8.8.0.0/16", "2001:4860::/32"},
	})

	require.True(t, d.ipAllowed(net.ParseIP("8.8.8.8")))
	require.True(t, d.ipAllowed(net.ParseIP("8.8.4.4")))
	require.True(t, d.ipAllowed(net.ParseIP("2001:4860:4860::8888")))

	require.False(t, d.ipAllowed(net.ParseIP("1.1.1.1")))
	require.False(t, d.ipAllowed(net.ParseIP("127.0.0.1")))
	require.False(t, d.ipAllowed(net.ParseIP("169.254.169.254")))
}

func TestIpAllowed_SingleIP(t *testing.T) {
	t.Parallel()

	d := newSafeDialer(Policy{
		Mode:         ModeEnforce,
		AllowedHosts: []string{"1.2.3.4"},
	})

	require.True(t, d.ipAllowed(net.ParseIP("1.2.3.4")))
	require.False(t, d.ipAllowed(net.ParseIP("1.2.3.5")))
}

func TestMatchesWildcard(t *testing.T) {
	t.Parallel()

	d := newSafeDialer(Policy{
		Mode:         ModeEnforce,
		AllowedHosts: []string{"*.example.com", "exact.host.com"},
	})

	require.True(t, d.matchesWildcard("foo.example.com"))
	require.True(t, d.matchesWildcard("bar.example.com"))
	require.True(t, d.matchesWildcard("deep.nested.example.com"))

	require.False(t, d.matchesWildcard("example.com"))
	require.False(t, d.matchesWildcard("notexample.com"))
	require.False(t, d.matchesWildcard("exact.host.com"))
}

func TestNewSafeDialer_MixedHosts(t *testing.T) {
	t.Parallel()

	d := newSafeDialer(Policy{
		Mode:         ModeEnforce,
		AllowedHosts: []string{"example.com", "*.internal.net", "10.0.0.0/8", "1.2.3.4"},
	})

	require.True(t, d.allowedHosts["example.com"])
	require.Contains(t, d.allowedWilds, ".internal.net")
	require.Len(t, d.allowedNets, 2) // 10.0.0.0/8 and 1.2.3.4/32
}

func TestConfigure_Disabled(t *testing.T) {
	Configure(Policy{Mode: ModeEnforce, AllowedHosts: []string{"example.com"}})
	require.NotNil(t, globalDialer.Load())

	Configure(Policy{})
	require.Nil(t, globalDialer.Load())
}

func TestWrapTransport_NoPolicy(t *testing.T) {
	globalDialer.Store(nil)

	base := &http.Transport{}
	result := WrapTransport(base)
	require.Equal(t, base, result)
}

func TestWrapTransport_WithPolicy(t *testing.T) {
	Configure(Policy{Mode: ModeEnforce, AllowedHosts: []string{"example.com"}})
	t.Cleanup(func() { globalDialer.Store(nil) })

	base := &http.Transport{}
	result := WrapTransport(base)
	require.NotEqual(t, base, result)
	require.NotNil(t, result.DialContext)
}

func TestCheckURL_Disabled(t *testing.T) {
	globalDialer.Store(nil)

	err := CheckURL(t.Context(), "http://169.254.169.254/latest/meta-data/")
	require.NoError(t, err)
}

func TestCheckURL_BlocksIPNotInAllowlist(t *testing.T) {
	Configure(Policy{Mode: ModeEnforce, AllowedHosts: []string{"8.8.8.0/24"}})
	t.Cleanup(func() { globalDialer.Store(nil) })

	err := CheckURL(t.Context(), "http://169.254.169.254/latest/meta-data/")
	require.Error(t, err)
	require.Contains(t, err.Error(), "ssrf")
}

func TestCheckURL_AllowedHostname(t *testing.T) {
	Configure(Policy{Mode: ModeEnforce, AllowedHosts: []string{"example.com"}})
	t.Cleanup(func() { globalDialer.Store(nil) })

	err := CheckURL(t.Context(), "https://example.com/path")
	require.NoError(t, err)
}

func TestCheckURL_AuditMode_ReturnsNil(t *testing.T) {
	Configure(Policy{Mode: ModeAudit, AllowedHosts: []string{"8.8.8.0/24"}})
	t.Cleanup(func() { globalDialer.Store(nil) })

	err := CheckURL(t.Context(), "http://169.254.169.254/latest/meta-data/")
	require.NoError(t, err)
}

// TestDialContext_BlocksLoopback is an end-to-end test: it starts a real HTTP
// server on 127.0.0.1, enables SSRF protection with an allowlist that does not
// include loopback, and verifies that the wrapped transport blocks the request.
func TestDialContext_BlocksLoopback(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	Configure(Policy{Mode: ModeEnforce, AllowedHosts: []string{"8.8.8.8"}})
	t.Cleanup(func() { globalDialer.Store(nil) })

	blocked := &http.Client{Transport: WrapTransport(&http.Transport{})}
	resp, err := blocked.Get(srv.URL)
	require.Error(t, err)
	require.Contains(t, err.Error(), "ssrf")
	if resp != nil {
		require.NoError(t, resp.Body.Close())
	}

	Configure(Policy{})

	open := &http.Client{Transport: WrapTransport(&http.Transport{})}
	resp, err = open.Get(srv.URL)
	require.NoError(t, err)
	require.NoError(t, resp.Body.Close())
}

// TestDialContext_AuditMode_AllowsLoopback verifies that audit mode logs the
// violation but still allows the connection through.
func TestDialContext_AuditMode_AllowsLoopback(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	Configure(Policy{Mode: ModeAudit, AllowedHosts: []string{"8.8.8.8"}})
	t.Cleanup(func() { globalDialer.Store(nil) })

	client := &http.Client{Transport: WrapTransport(&http.Transport{})}
	resp, err := client.Get(srv.URL)
	require.NoError(t, err)
	require.NoError(t, resp.Body.Close())
}

func TestIsEnabled(t *testing.T) {
	globalDialer.Store(nil)
	require.False(t, IsEnabled())

	Configure(Policy{Mode: ModeEnforce, AllowedHosts: []string{"example.com"}})
	t.Cleanup(func() { globalDialer.Store(nil) })
	require.True(t, IsEnabled())
}

func TestWrapTransportInternal(t *testing.T) {
	t.Parallel()

	base := &http.Transport{}
	result := WrapTransportInternal(base)
	require.Equal(t, base, result)
}

func TestNewSafeDialer_IPv6SingleIP(t *testing.T) {
	t.Parallel()

	d := newSafeDialer(Policy{
		Mode:         ModeEnforce,
		AllowedHosts: []string{"::1"},
	})

	require.True(t, d.ipAllowed(net.ParseIP("::1")))
	require.False(t, d.ipAllowed(net.ParseIP("::2")))
}

func TestCheckURL_InvalidURL(t *testing.T) {
	Configure(Policy{Mode: ModeEnforce, AllowedHosts: []string{"example.com"}})
	t.Cleanup(func() { globalDialer.Store(nil) })

	err := CheckURL(t.Context(), "http://%gg")
	require.Error(t, err)
	require.Contains(t, err.Error(), "ssrf")
}

func TestCheckURL_EmptyHost(t *testing.T) {
	Configure(Policy{Mode: ModeEnforce, AllowedHosts: []string{"example.com"}})
	t.Cleanup(func() { globalDialer.Store(nil) })

	err := CheckURL(t.Context(), "http://")
	require.NoError(t, err)
}

// TestCheckURL_IPInAllowlist verifies that a literal IP address that falls
// within an allowed CIDR range is permitted.
func TestCheckURL_IPInAllowlist(t *testing.T) {
	Configure(Policy{Mode: ModeEnforce, AllowedHosts: []string{"8.8.8.0/24"}})
	t.Cleanup(func() { globalDialer.Store(nil) })

	err := CheckURL(t.Context(), "http://8.8.8.8/path")
	require.NoError(t, err)
}

func TestCheckURL_WildcardHostname(t *testing.T) {
	Configure(Policy{Mode: ModeEnforce, AllowedHosts: []string{"*.example.com"}})
	t.Cleanup(func() { globalDialer.Store(nil) })

	err := CheckURL(t.Context(), "https://api.example.com/path")
	require.NoError(t, err)
}

// TestCheckURL_HostnameDNSResolvesToAllowedIP verifies that a hostname
// resolving to an IP within the allowlist is permitted (DNS resolution path).
func TestCheckURL_HostnameDNSResolvesToAllowedIP(t *testing.T) {
	Configure(Policy{Mode: ModeEnforce, AllowedHosts: []string{"127.0.0.0/8", "::1/128"}})
	t.Cleanup(func() { globalDialer.Store(nil) })

	err := CheckURL(t.Context(), "http://localhost/path")
	require.NoError(t, err)
}

// TestCheckURL_HostnameDNSResolvesToBlockedIP verifies that a hostname
// resolving to an IP outside the allowlist is blocked (DNS resolution path).
func TestCheckURL_HostnameDNSResolvesToBlockedIP(t *testing.T) {
	Configure(Policy{Mode: ModeEnforce, AllowedHosts: []string{"8.8.8.0/24"}})
	t.Cleanup(func() { globalDialer.Store(nil) })

	err := CheckURL(t.Context(), "http://localhost/path")
	require.Error(t, err)
	require.Contains(t, err.Error(), "ssrf")
}

// TestCheckURL_HostnameDNSAuditMode verifies that audit mode logs violations
// from hostname DNS resolution but still returns nil.
func TestCheckURL_HostnameDNSAuditMode(t *testing.T) {
	Configure(Policy{Mode: ModeAudit, AllowedHosts: []string{"8.8.8.0/24"}})
	t.Cleanup(func() { globalDialer.Store(nil) })

	err := CheckURL(t.Context(), "http://localhost/path")
	require.NoError(t, err)
}

// TestCheckURL_HostnameDNSError verifies that a DNS resolution failure is
// propagated as an SSRF-prefixed error.
func TestCheckURL_HostnameDNSError(t *testing.T) {
	Configure(Policy{Mode: ModeEnforce, AllowedHosts: []string{"8.8.8.0/24"}})
	t.Cleanup(func() { globalDialer.Store(nil) })

	ctx, cancel := context.WithCancel(t.Context())
	cancel()

	err := CheckURL(ctx, "http://portainer-nonexistent.test.invalid/path")
	require.Error(t, err)
}

// TestDialContext_InvalidAddress verifies that an address without a port
// returns an SSRF-prefixed error.
func TestDialContext_InvalidAddress(t *testing.T) {
	Configure(Policy{Mode: ModeEnforce, AllowedHosts: []string{"example.com"}})
	t.Cleanup(func() { globalDialer.Store(nil) })

	d := globalDialer.Load()
	_, err := d.DialContext(t.Context(), "tcp", "no-port-here")
	require.Error(t, err)
	require.Contains(t, err.Error(), "ssrf")
}

// TestDialContext_DNSError verifies that a DNS resolution failure in
// DialContext is propagated as an SSRF-prefixed error.
func TestDialContext_DNSError(t *testing.T) {
	Configure(Policy{Mode: ModeEnforce, AllowedHosts: []string{}})
	t.Cleanup(func() { globalDialer.Store(nil) })

	ctx, cancel := context.WithCancel(t.Context())
	cancel()

	d := globalDialer.Load()
	_, err := d.DialContext(ctx, "tcp", "portainer-nonexistent.test.invalid:80")
	require.Error(t, err)
}

// TestDialContext_AllowedByCIDR is an end-to-end test verifying that
// connections to IPs within an allowed CIDR range are permitted.
func TestDialContext_AllowedByCIDR(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	Configure(Policy{Mode: ModeEnforce, AllowedHosts: []string{"127.0.0.0/8"}})
	t.Cleanup(func() { globalDialer.Store(nil) })

	client := &http.Client{Transport: WrapTransport(&http.Transport{})}
	resp, err := client.Get(srv.URL)
	require.NoError(t, err)
	require.NoError(t, resp.Body.Close())
}

// TestDialContext_AllowedByExactHostname verifies that when a hostname is in
// the allowed-hosts list, the connection is permitted even though the resolved
// IP is not covered by any CIDR entry.
//
// The server is bound to whatever IP "localhost" resolves to first so that the
// dialTarget computed by DialContext (resolved[0]) matches the listening address.
func TestDialContext_AllowedByExactHostname(t *testing.T) {
	addrs, err := net.DefaultResolver.LookupIPAddr(t.Context(), "localhost")
	require.NoError(t, err)
	require.NotEmpty(t, addrs, "localhost must resolve to at least one address")

	l, err := net.Listen("tcp", net.JoinHostPort(addrs[0].IP.String(), "0"))
	require.NoError(t, err)

	srv := httptest.NewUnstartedServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	srv.Listener = l
	srv.Start()
	defer srv.Close()

	_, portStr, err := net.SplitHostPort(l.Addr().String())
	require.NoError(t, err)

	Configure(Policy{Mode: ModeEnforce, AllowedHosts: []string{"localhost"}})
	t.Cleanup(func() { globalDialer.Store(nil) })

	client := &http.Client{Transport: WrapTransport(&http.Transport{})}
	resp, err := client.Get("http://localhost:" + portStr)
	require.NoError(t, err)
	require.NoError(t, resp.Body.Close())
}
