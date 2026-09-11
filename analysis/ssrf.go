//go:build ignore

package gorules

import "github.com/quasilyte/go-ruleguard/dsl"

// unwrappedHTTPTransport flags any bare *http.Transport construction (a
// composite literal or new(http.Transport)) reaching a var, a struct field, a
// function call, or a return, at any position among other values. All
// transports must be created via ssrf.NewTransport or ssrf.NewInternalTransport,
// which clone http.DefaultTransport and handle SSRF protection internally.
//
// Matches are by resolved type (Type.Is) on the constructed value itself, not
// by the literal "http" token or a blanket unary-expression check, so they
// still fire when net/http is imported under a different local name, and they
// do not fire on a dereference or address-of an already-safe transport.
// getter.WithTransport is excluded from the call-form match; it is covered by
// the more specific diagnostic in helmGetterTransport. Test files are exempt:
// they build fixtures against local/mock servers, never a real production
// destination, so an unwrapped transport in a _test.go file carries no SSRF risk.
func unwrappedHTTPTransport(m dsl.Matcher) {
	m.Match(`$_ := &$typ{$*_}`, `$_ = &$typ{$*_}`, `var $_ = &$typ{$*_}`).
		Where(m["typ"].Type.Is(`http.Transport`) && !m.File().Name.Matches(`_test\.go$`)).
		Report(`bare *http.Transport; use ssrf.NewTransport(tlsConfig) or ssrf.NewInternalTransport(tlsConfig) instead`)

	m.Match(`$_ := new($typ)`, `$_ = new($typ)`, `var $_ = new($typ)`).
		Where(m["typ"].Type.Is(`http.Transport`) && !m.File().Name.Matches(`_test\.go$`)).
		Report(`bare *http.Transport; use ssrf.NewTransport(tlsConfig) or ssrf.NewInternalTransport(tlsConfig) instead`)

	m.Match(`$_: &$typ{$*_}`, `$_: new($typ)`).
		Where(m["typ"].Type.Is(`http.Transport`) && !m.File().Name.Matches(`_test\.go$`)).
		Report(`struct field initialized with a bare *http.Transport; use ssrf.NewTransport(tlsConfig) or ssrf.NewInternalTransport(tlsConfig) instead`)

	m.Match(`$f($*_, &$typ{$*_}, $*_)`, `$f($*_, new($typ), $*_)`).
		Where(m["typ"].Type.Is(`http.Transport`) &&
			!m["f"].Text.Matches(`^getter\.WithTransport$`) &&
			!m.File().Name.Matches(`_test\.go$`)).
		Report(`$f receives a bare *http.Transport; use ssrf.NewTransport(tlsConfig) or ssrf.NewInternalTransport(tlsConfig) instead`)

	m.Match(`return $*_, &$typ{$*_}, $*_`, `return $*_, new($typ), $*_`).
		Where(m["typ"].Type.Is(`http.Transport`) && !m.File().Name.Matches(`_test\.go$`)).
		Report(`returning a bare *http.Transport; use ssrf.NewTransport(tlsConfig) or ssrf.NewInternalTransport(tlsConfig) instead`)
}

// helmGetterTransport flags getter.WithTransport calls that receive a bare
// *http.Transport (alias-immune, see unwrappedHTTPTransport), and flags any
// getter.All call missing a getter.WithTransport option entirely. Helm v4
// installs its own transport and bypasses http.DefaultTransport, so a getter
// with no explicit transport option is unprotected.
func helmGetterTransport(m dsl.Matcher) {
	m.Match(`getter.WithTransport($rhs)`).
		Where(m["rhs"].Type.Is(`*http.Transport`) &&
			(m["rhs"].Node.Is(`UnaryExpr`) || (m["rhs"].Node.Is(`CallExpr`) && m["rhs"].Text.Matches(`^new\(`)))).
		Report(`getter.WithTransport called with a bare *http.Transport; use ssrf.NewTransport(tlsConfig) as Helm v4 bypasses http.DefaultTransport`)

	m.Match(`getter.All($_, $*opts)`).
		Where(!m["opts"].Contains(`getter.WithTransport($_)`)).
		Report(`getter.All called without getter.WithTransport(ssrf.NewTransport(tlsConfig)); Helm v4 bypasses http.DefaultTransport`)
}

// cloneDefaultTransport flags direct clones of *http.Transport outside main.go.
// The one legitimate clone is in main.go where http.DefaultTransport is globally
// wrapped with SSRF protection at server startup.
func cloneDefaultTransport(m dsl.Matcher) {
	m.Match(`$ta.Clone()`).
		Where(m["ta"].Node.Is(`TypeAssertExpr`) &&
			m["ta"].Type.Is(`*http.Transport`) &&
			!m.File().Name.Matches(`^main\.go$`)).
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
