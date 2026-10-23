//go:build ignore

package gorules

import "github.com/quasilyte/go-ruleguard/dsl"

// unwrappedHTTPTransport flags any bare http.Transport composite literal.
// All transports must be created via ssrf.NewTransport or ssrf.NewInternalTransport,
// which clone http.DefaultTransport and handle SSRF protection internally.
func unwrappedHTTPTransport(m dsl.Matcher) {
	m.Match(`$f(&http.Transport{$*_})`).
		Report(`$f receives a bare *http.Transport; use ssrf.NewTransport(tlsConfig) or ssrf.NewInternalTransport(tlsConfig) instead`)

	m.Match(`$_ := &http.Transport{$*_}`).
		Report(`bare *http.Transport variable; use ssrf.NewTransport(tlsConfig) or ssrf.NewInternalTransport(tlsConfig) instead`)

	m.Match(`$_.Transport = &http.Transport{$*_}`).
		Report(`bare *http.Transport field assignment; use ssrf.NewTransport(tlsConfig) or ssrf.NewInternalTransport(tlsConfig) instead`)
}

// helmGetterTransport flags getter.WithTransport calls that receive a bare *http.Transport.
// Helm v4 installs its own transport and bypasses http.DefaultTransport, so the transport
// passed here must be created via ssrf.NewTransport.
func helmGetterTransport(m dsl.Matcher) {
	m.Match(`getter.WithTransport(&http.Transport{$*_})`).
		Report(`getter.WithTransport called with a bare *http.Transport; use ssrf.NewTransport(tlsConfig) as Helm v4 bypasses http.DefaultTransport`)
}

// cloneDefaultTransport flags direct clones of *http.Transport outside main.go.
// The one legitimate clone is in main.go where http.DefaultTransport is globally
// wrapped with SSRF protection at server startup.
func cloneDefaultTransport(m dsl.Matcher) {
	m.Match(`$_.(*http.Transport).Clone()`).
		Where(!m.File().Name.Matches(`^main\.go$`)).
		Report(`cloning *http.Transport directly is forbidden; use ssrf.NewTransport(tlsConfig) or ssrf.NewInternalTransport(tlsConfig) instead`)
}

// internalTransportMisuse flags calls to NewInternalTransport outside the proxy
// factory files where Chisel-tunnel and in-cluster K8s destinations are valid exemptions.
func internalTransportMisuse(m dsl.Matcher) {
	m.Match(`ssrf.NewInternalTransport($*_)`).
		Where(
			!(m.File().PkgPath.Matches(`proxy/factory`) &&
				m.File().Name.Matches(`^(docker|agent|local_transport|edge_transport|docker_unix|docker_windows)\.go$`))).
		Report(`NewInternalTransport bypasses SSRF validation; only valid in the proxy factory files for local sockets and internally-routed endpoints`)
}

// dialerOverride flags direct assignments to any of the dialer fields on a transport.
// The only valid assignments are in docker_unix.go and docker_windows.go where a
// custom dialer is required for unix sockets and named pipes.
func dialerOverride(m dsl.Matcher) {
	m.Match(`$_.DialContext = $*_`).
		Where(
			!(m.File().PkgPath.Matches(`proxy/factory`) &&
				m.File().Name.Matches(`^(docker_unix|docker_windows)\.go$`))).
		Report(`direct DialContext assignment replaces the transport dialer; use ssrf.NewTransport or ssrf.NewInternalTransport instead`)

	m.Match(`$_.Dial = $*_`).
		Where(
			!(m.File().PkgPath.Matches(`proxy/factory`) &&
				m.File().Name.Matches(`^(docker_unix|docker_windows)\.go$`))).
		Report(`direct Dial assignment replaces the transport dialer; use ssrf.NewTransport or ssrf.NewInternalTransport instead`)

	m.Match(`$_.DialTLSContext = $*_`).
		Where(
			!(m.File().PkgPath.Matches(`proxy/factory`) &&
				m.File().Name.Matches(`^(docker_unix|docker_windows)\.go$`))).
		Report(`direct DialTLSContext assignment replaces the transport dialer; use ssrf.NewTransport or ssrf.NewInternalTransport instead`)

	m.Match(`$_.DialTLS = $*_`).
		Where(
			!(m.File().PkgPath.Matches(`proxy/factory`) &&
				m.File().Name.Matches(`^(docker_unix|docker_windows)\.go$`))).
		Report(`direct DialTLS assignment replaces the transport dialer; use ssrf.NewTransport or ssrf.NewInternalTransport instead`)
}
