package ssrf

import (
	"crypto/tls"
	"net/http"
)

// NewTransport creates an SSRF-protected transport for user-influenced destinations.
// It clones http.DefaultTransport as its base (inheriting pool and timeout defaults)
// and applies the global SSRF dial-context filter so mode changes take effect without
// restarting. tlsConfig may be nil to preserve standard TLS behavior (system CAs).
func NewTransport(tlsConfig *tls.Config) *http.Transport {
	base := http.DefaultTransport.(*http.Transport).Clone()
	base.TLSClientConfig = tlsConfig
	applySSRF(base)

	return base
}

// NewInternalTransport creates a plain transport for destinations chosen by Portainer,
// not by the user (Docker socket proxy, Chisel tunnels, in-cluster Kubernetes API).
// It clones http.DefaultTransport as its base. tlsConfig may be nil.
// Using this function instead of NewTransport makes the exemption explicit and
// satisfies the ruleguard lint rule.
func NewInternalTransport(tlsConfig *tls.Config) *http.Transport {
	base := http.DefaultTransport.(*http.Transport).Clone()
	base.TLSClientConfig = tlsConfig

	return base
}

// WrapDefaultTransport replaces http.DefaultTransport with an SSRF-protected version.
// Must be called after Configure. Returns false if DefaultTransport is not an *http.Transport.
func WrapDefaultTransport() bool {
	dt, ok := http.DefaultTransport.(*http.Transport)
	if !ok {
		return false
	}

	cloned := dt.Clone()
	applySSRF(cloned)
	http.DefaultTransport = cloned

	return true
}

// HTTP1Only returns a Protocols value that enables HTTP/1.x and disables HTTP/2.
// Use this to assign to Transport.Protocols — a nil Protocols defaults to both
// HTTP/1 and HTTP/2, so the field must be non-nil to restrict to HTTP/1 only.
func HTTP1Only() *http.Protocols {
	p := new(http.Protocols)
	p.SetHTTP1(true)
	return p
}

// applySSRF sets the SSRF-filtering DialContext on t when the global dialer is active.
func applySSRF(t *http.Transport) {
	d := globalDialer.Load()
	if d != nil {
		t.DialContext = d.DialContext
	}
}
