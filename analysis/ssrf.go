//go:build ignore

package gorules

import "github.com/quasilyte/go-ruleguard/dsl"

// unwrappedHTTPTransport flags http.Transport composite literals that are not
// the direct argument to ssrf.WrapTransport.
func unwrappedHTTPTransport(m dsl.Matcher) {
	// Inline construction passed to a function call.
	m.Match(`$f(&http.Transport{$*_})`).
		Where(m["f"].Text != "ssrf.WrapTransport" && m["f"].Text != "WrapTransport" &&
			m["f"].Text != "ssrf.WrapTransportInternal" && m["f"].Text != "WrapTransportInternal").
		Report(`$f receives a bare *http.Transport; wrap with ssrf.WrapTransport() to enforce the SSRF protection policy`)

	// Variable assigned a bare transport (cannot be tracked to a later WrapTransport call).
	m.Match(`$_ := &http.Transport{$*_}`).
		Report(`bare *http.Transport variable; use ssrf.WrapTransport(&http.Transport{...}) inline instead`)
}

// internalTransportMisuse flags calls to WrapTransportInternal outside the four proxy
// factory files where Chisel-tunnel and in-cluster K8s destinations are valid exemptions.
func internalTransportMisuse(m dsl.Matcher) {
	m.Match(`ssrf.WrapTransportInternal($*_)`).
		Where(
			!(m.File().PkgPath.Matches(`proxy/factory`) &&
				m.File().Name.Matches(`^(docker|agent|local_transport|edge_transport)\.go$`))).
		Report(`WrapTransportInternal bypasses SSRF validation; only valid in the kubernetes local/edge transport constructors and the docker/agent proxy factories`)
}
