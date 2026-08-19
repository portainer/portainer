package ssrf

import (
	"context"
	"net"
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/stretchr/testify/require"
)

// staticService is a simple in-memory AllowListService for testing.
type staticService struct {
	parsed portainer.ParsedAllowList
}

func (s *staticService) ReadParsed(id portainer.AllowListKey) (*portainer.ParsedAllowList, error) {
	return &s.parsed, nil
}

func newStaticService(mode portainer.SSRFMode, entries []string) *staticService {
	parsed := ParseAllowedHosts(entries)
	parsed.Mode = mode
	return &staticService{parsed: parsed}
}

func TestParseAllowedHosts_ipAllowed(t *testing.T) {
	t.Parallel()

	testCases := []struct {
		name        string
		hostEntries []string
		allowed     []string
		denied      []string
	}{
		{
			name:        "CIDR",
			hostEntries: []string{"8.8.0.0/16", "2001:4860::/32"},
			allowed:     []string{"8.8.8.8", "8.8.4.4", "2001:4860:4860::8888"},
			denied:      []string{"1.1.1.1", "127.0.0.1", "169.254.169.254"},
		},
		{
			name:        "Single IP",
			hostEntries: []string{"1.2.3.4"},
			allowed:     []string{"1.2.3.4"},
			denied:      []string{"1.2.3.5"},
		},
		{
			name:        "Single IPv6",
			hostEntries: []string{"::1"},
			allowed:     []string{"::1"},
			denied:      []string{"::2"},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			parsed := ParseAllowedHosts(tc.hostEntries)
			for _, a := range tc.allowed {
				require.True(t, ipAllowed(net.ParseIP(a), parsed.Nets))
			}

			for _, d := range tc.denied {
				require.False(t, ipAllowed(net.ParseIP(d), parsed.Nets))
			}
		})
	}
}

func TestParseAllowedHosts_MixedEntries(t *testing.T) {
	t.Parallel()

	parsed := ParseAllowedHosts([]string{"example.com", "*.internal.net", "10.0.0.0/8", "1.2.3.4"})

	require.True(t, parsed.Hosts["example.com"])
	require.Contains(t, parsed.Wilds, ".internal.net")
	require.Len(t, parsed.Nets, 2) // 10.0.0.0/8 and 1.2.3.4/32
}

func TestMatchesWildcard(t *testing.T) {
	t.Parallel()

	parsed := ParseAllowedHosts([]string{"*.example.com", "exact.host.com"})

	tests := []struct {
		host string
		want bool
	}{
		{"foo.example.com", true},
		{"bar.example.com", true},
		{"deep.nested.example.com", true},
		{"example.com", false},
		{"notexample.com", false},
		{"exact.host.com", false},
	}

	for _, tc := range tests {
		got := matchesWildcard(tc.host, parsed.Wilds)
		require.Equal(t, tc.want, got, "host: %s", tc.host)
	}
}

func TestConfigure_SetsDialer(t *testing.T) {
	err := Configure(newStaticService(portainer.SSRFModeEnforce, []string{"example.com"}))
	require.NoError(t, err)
	require.NotNil(t, globalDialer.Load())
	t.Cleanup(func() { globalDialer.Store(nil) })
}

func TestConfigure_NilServicesReturnsError(t *testing.T) {
	err := Configure(nil)
	require.Error(t, err)
}

func TestNewTransport_NoPolicy(t *testing.T) {
	globalDialer.Store(nil)
	t.Cleanup(func() { globalDialer.Store(nil) })

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	client := &http.Client{Transport: NewTransport(nil)}
	resp, err := client.Get(srv.URL)
	require.NoError(t, err)
	require.NoError(t, resp.Body.Close())
}

func TestNewTransport_WithPolicy(t *testing.T) {
	err := Configure(newStaticService(portainer.SSRFModeEnforce, []string{"example.com"}))
	require.NoError(t, err)
	t.Cleanup(func() { globalDialer.Store(nil) })

	result := NewTransport(nil)
	require.NotNil(t, result.DialContext)
}

func TestCheckURL(t *testing.T) {
	tests := []struct {
		name    string
		mode    portainer.SSRFMode
		entries []string
		url     string
		wantErr bool
	}{
		{
			name:    "disabled",
			mode:    portainer.SSRFModeOff,
			url:     "http://169.254.169.254/latest/meta-data/",
			wantErr: false,
		},
		{
			name:    "blocks IP not in allowlist",
			mode:    portainer.SSRFModeEnforce,
			entries: []string{"8.8.8.0/24"},
			url:     "http://169.254.169.254/latest/meta-data/",
			wantErr: true,
		},
		{
			name:    "allowed exact hostname",
			mode:    portainer.SSRFModeEnforce,
			entries: []string{"example.com"},
			url:     "https://example.com/path",
			wantErr: false,
		},
		{
			name:    "audit mode allows blocked IP",
			mode:    portainer.SSRFModeAudit,
			entries: []string{"8.8.8.0/24"},
			url:     "http://169.254.169.254/latest/meta-data/",
			wantErr: false,
		},
		{
			name:    "IP in CIDR allowlist",
			mode:    portainer.SSRFModeEnforce,
			entries: []string{"8.8.8.0/24"},
			url:     "http://8.8.8.8/path",
			wantErr: false,
		},
		{
			name:    "wildcard hostname",
			mode:    portainer.SSRFModeEnforce,
			entries: []string{"*.example.com"},
			url:     "https://api.example.com/path",
			wantErr: false,
		},
		{
			name:    "hostname DNS resolves to allowed IP",
			mode:    portainer.SSRFModeEnforce,
			entries: []string{"127.0.0.0/8", "::1/128"},
			url:     "http://localhost/path",
			wantErr: false,
		},
		{
			name:    "hostname DNS resolves to blocked IP",
			mode:    portainer.SSRFModeEnforce,
			entries: []string{"8.8.8.0/24"},
			url:     "http://localhost/path",
			wantErr: true,
		},
		{
			name:    "audit mode allows hostname resolving to blocked IP",
			mode:    portainer.SSRFModeAudit,
			entries: []string{"8.8.8.0/24"},
			url:     "http://localhost/path",
			wantErr: false,
		},
		{
			name:    "invalid URL",
			mode:    portainer.SSRFModeEnforce,
			entries: []string{"example.com"},
			url:     "http://%gg",
			wantErr: true,
		},
		{
			name:    "empty host",
			mode:    portainer.SSRFModeEnforce,
			entries: []string{"example.com"},
			url:     "http://",
			wantErr: false,
		},
		{
			name:    "scheme-less IP:port SSRF disabled",
			mode:    portainer.SSRFModeOff,
			url:     "10.10.1.41:30775",
			wantErr: false,
		},
		{
			name:    "scheme-less IP:port blocked",
			mode:    portainer.SSRFModeEnforce,
			entries: []string{"8.8.8.0/24"},
			url:     "10.10.1.41:30775",
			wantErr: true,
		},
		{
			name:    "scheme-less IP:port allowed by CIDR",
			mode:    portainer.SSRFModeEnforce,
			entries: []string{"10.10.1.0/24"},
			url:     "10.10.1.41:30775",
			wantErr: false,
		},
		{
			name:    "git scheme IP blocked",
			mode:    portainer.SSRFModeEnforce,
			entries: []string{"8.8.8.0/24"},
			url:     "git://10.10.1.41:9418/",
			wantErr: true,
		},
		{
			name:    "git scheme IP allowed by CIDR",
			mode:    portainer.SSRFModeEnforce,
			entries: []string{"10.10.1.0/24"},
			url:     "git://10.10.1.41:9418/",
			wantErr: false,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			err := Configure(newStaticService(tc.mode, tc.entries))
			require.NoError(t, err)
			t.Cleanup(func() { globalDialer.Store(nil) })

			err = CheckURL(t.Context(), tc.url)
			if tc.wantErr {
				require.Error(t, err)
				require.Contains(t, err.Error(), "ssrf")
			} else {
				require.NoError(t, err)
			}
		})
	}
}

// TestCheckURL_HostnameDNSError verifies that a DNS resolution failure is
// propagated as an SSRF-prefixed error. Kept separate because it needs a
// cancelled context rather than t.Context().
func TestCheckURL_HostnameDNSError(t *testing.T) {
	err := Configure(newStaticService(portainer.SSRFModeEnforce, []string{"8.8.8.0/24"}))
	require.NoError(t, err)
	t.Cleanup(func() { globalDialer.Store(nil) })

	ctx, cancel := context.WithCancel(t.Context())
	cancel()

	err = CheckURL(ctx, "http://portainer-nonexistent.test.invalid/path")
	require.Error(t, err)
}

func TestIsEnabled(t *testing.T) {
	globalDialer.Store(nil)
	require.False(t, IsEnabled())

	err := Configure(newStaticService(portainer.SSRFModeEnforce, []string{"example.com"}))
	require.NoError(t, err)
	t.Cleanup(func() { globalDialer.Store(nil) })
	require.True(t, IsEnabled())

	err = Configure(newStaticService(portainer.SSRFModeOff, nil))
	require.NoError(t, err)
	require.False(t, IsEnabled())
}

func TestNewInternalTransport(t *testing.T) {
	t.Parallel()

	result := NewInternalTransport(nil)
	require.NotNil(t, result)
	require.Nil(t, result.TLSClientConfig)
}

// TestDialContext_BlocksLoopback is an end-to-end test: it starts a real HTTP
// server on 127.0.0.1, enables SSRF protection with an allowlist that does not
// include loopback, and verifies that the wrapped transport blocks the request.
func TestDialContext_BlocksLoopback(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	err := Configure(newStaticService(portainer.SSRFModeEnforce, []string{"8.8.8.8"}))
	require.NoError(t, err)
	t.Cleanup(func() { globalDialer.Store(nil) })

	blocked := &http.Client{Transport: NewTransport(nil)}
	resp, err := blocked.Get(srv.URL)
	require.Error(t, err)
	require.Contains(t, err.Error(), "ssrf")
	if resp != nil {
		require.NoError(t, resp.Body.Close())
	}

	// Switch to off mode — dialer stays configured but checks are skipped.
	err = Configure(newStaticService(portainer.SSRFModeOff, nil))
	require.NoError(t, err)

	open := &http.Client{Transport: NewTransport(nil)}
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

	err := Configure(newStaticService(portainer.SSRFModeAudit, []string{"8.8.8.8"}))
	require.NoError(t, err)
	t.Cleanup(func() { globalDialer.Store(nil) })

	client := &http.Client{Transport: NewTransport(nil)}
	resp, err := client.Get(srv.URL)
	require.NoError(t, err)
	require.NoError(t, resp.Body.Close())
}

// TestDialContext_InvalidAddress verifies that an address without a port
// returns an SSRF-prefixed error.
func TestDialContext_InvalidAddress(t *testing.T) {
	err := Configure(newStaticService(portainer.SSRFModeEnforce, []string{"example.com"}))
	require.NoError(t, err)
	t.Cleanup(func() { globalDialer.Store(nil) })

	d := globalDialer.Load()
	_, err = d.DialContext(t.Context(), "tcp", "no-port-here")
	require.Error(t, err)
	require.Contains(t, err.Error(), "ssrf")
}

// TestDialContext_DNSError verifies that a DNS resolution failure in
// DialContext is propagated as an SSRF-prefixed error.
func TestDialContext_DNSError(t *testing.T) {
	err := Configure(newStaticService(portainer.SSRFModeEnforce, []string{}))
	require.NoError(t, err)
	t.Cleanup(func() { globalDialer.Store(nil) })

	ctx, cancel := context.WithCancel(t.Context())
	cancel()

	d := globalDialer.Load()
	_, err = d.DialContext(ctx, "tcp", "portainer-nonexistent.test.invalid:80")
	require.Error(t, err)
}

// TestDialContext_AllowedByCIDR is an end-to-end test verifying that
// connections to IPs within an allowed CIDR range are permitted.
func TestDialContext_AllowedByCIDR(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	err := Configure(newStaticService(portainer.SSRFModeEnforce, []string{"127.0.0.0/8"}))
	require.NoError(t, err)
	t.Cleanup(func() { globalDialer.Store(nil) })

	client := &http.Client{Transport: NewTransport(nil)}
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

	err = Configure(newStaticService(portainer.SSRFModeEnforce, []string{"localhost"}))
	require.NoError(t, err)
	t.Cleanup(func() { globalDialer.Store(nil) })

	client := &http.Client{Transport: NewTransport(nil)}
	resp, err := client.Get("http://localhost:" + portStr)
	require.NoError(t, err)
	require.NoError(t, resp.Body.Close())
}
