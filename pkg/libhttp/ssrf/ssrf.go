package ssrf

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"strings"
	"sync/atomic"

	"github.com/rs/zerolog/log"
)

// Mode controls how the SSRF policy is applied.
type Mode string

const (
	// ModeOff disables SSRF protection entirely. All connections pass through unchanged.
	ModeOff Mode = "off"
	// ModeAudit resolves and checks destinations but only logs violations; connections are allowed.
	ModeAudit Mode = "audit"
	// ModeEnforce blocks connections that violate the policy.
	ModeEnforce Mode = "enforce"
)

// Policy defines the SSRF protection policy for outbound HTTP connections.
type Policy struct {
	// Mode controls whether protection is off, in audit-only mode, or enforcing.
	Mode Mode

	// AllowedHosts is the allowlist of permitted destinations.
	// Accepted formats:
	//   - Exact hostname: "example.com"
	//   - Wildcard hostname: "*.example.com" (matches any subdomain at any depth)
	//   - Single IP: "1.2.3.4"
	//   - CIDR range: "10.0.0.0/8"
	//
	// When Mode is ModeEnforce and AllowedHosts is empty, all outbound connections are blocked.
	AllowedHosts []string
}

type safeDialer struct {
	base         net.Dialer
	mode         Mode
	allowedNets  []*net.IPNet
	allowedHosts map[string]bool
	allowedWilds []string // derived from "*.foo.com" entries; stored as ".foo.com"
}

var globalDialer atomic.Pointer[safeDialer]

// Configure initializes the global SSRF policy. Intended to be called once
// at startup before any outbound HTTP connections are established.
func Configure(policy Policy) {
	if policy.Mode == ModeOff || policy.Mode == "" {
		globalDialer.Store(nil)
		return
	}

	globalDialer.Store(newSafeDialer(policy))
}

// IsEnabled reports whether SSRF protection is currently active (audit or enforce).
func IsEnabled() bool {
	return globalDialer.Load() != nil
}

// CheckURL validates rawURL against the active SSRF policy without making a
// connection. Returns nil when protection is disabled or the destination is
// permitted. In audit mode, logs a warning on violations and returns nil.
func CheckURL(ctx context.Context, rawURL string) error {
	d := globalDialer.Load()
	if d == nil {
		return nil
	}

	u, err := url.Parse(rawURL)
	if err != nil {
		return fmt.Errorf("ssrf: invalid URL %q: %w", rawURL, err)
	}

	host := u.Hostname()
	if host == "" {
		return nil
	}

	return d.checkHost(ctx, host)
}

// WrapTransport clones t and replaces its DialContext with the global SSRF-filtering
// dialer. Returns t unchanged when SSRF protection is not configured.
func WrapTransport(t *http.Transport) *http.Transport {
	d := globalDialer.Load()
	if d == nil {
		return t
	}

	cloned := t.Clone()
	cloned.DialContext = d.DialContext

	return cloned
}

// WrapTransportInternal is a documented no-op for transports that connect to
// internally computed destinations (local Docker socket proxy, Chisel tunnels,
// in-cluster Kubernetes API). The destination is chosen by Portainer, not
// supplied by any user, so SSRF validation is not applicable. Using this
// function instead of WrapTransport makes the exemption explicit and
// satisfies the ruleguard lint rule.
func WrapTransportInternal(t *http.Transport) *http.Transport {
	return t
}

func newSafeDialer(policy Policy) *safeDialer {
	allowedNets := make([]*net.IPNet, 0, len(policy.AllowedHosts))
	allowedHosts := make(map[string]bool, len(policy.AllowedHosts))
	var allowedWilds []string

	for _, entry := range policy.AllowedHosts {
		if _, network, err := net.ParseCIDR(entry); err == nil {
			allowedNets = append(allowedNets, network)
			continue
		}

		if ip := net.ParseIP(entry); ip != nil {
			bits := 32
			if ip.To4() == nil {
				bits = 128
			}

			mask := net.CIDRMask(bits, bits)
			allowedNets = append(allowedNets, &net.IPNet{IP: ip.Mask(mask), Mask: mask})

			continue
		}

		if strings.HasPrefix(entry, "*.") {
			allowedWilds = append(allowedWilds, entry[1:]) // "*.foo.com" -> ".foo.com"
			continue
		}

		allowedHosts[entry] = true
	}

	return &safeDialer{
		mode:         policy.Mode,
		allowedNets:  allowedNets,
		allowedHosts: allowedHosts,
		allowedWilds: allowedWilds,
	}
}

// DialContext resolves addr, validates all resolved IPs against the allowlist policy,
// then dials using the first resolved IP to prevent DNS rebinding attacks.
func (d *safeDialer) DialContext(ctx context.Context, network, addr string) (net.Conn, error) {
	host, port, err := net.SplitHostPort(addr)
	if err != nil {
		return nil, fmt.Errorf("ssrf: invalid address %q: %w", addr, err)
	}

	resolved, err := net.DefaultResolver.LookupIPAddr(ctx, host)
	if err != nil {
		return nil, fmt.Errorf("ssrf: resolving %q: %w", host, err)
	}

	if len(resolved) == 0 {
		return nil, fmt.Errorf("ssrf: no addresses resolved for %q", host)
	}

	// Dial by resolved IP regardless of how the host was allowed to close the
	// window between DNS validation and the TCP handshake (DNS rebinding).
	dialTarget := net.JoinHostPort(resolved[0].IP.String(), port)

	if d.allowedHosts[host] || d.matchesWildcard(host) {
		return d.base.DialContext(ctx, network, dialTarget)
	}

	for _, a := range resolved {
		if !d.ipAllowed(a.IP) {
			if d.mode == ModeAudit {
				log.Warn().Str("host", host).Str("ip", a.IP.String()).Msg("ssrf: destination not in allowlist (audit mode, allowing)")
				continue
			}

			return nil, fmt.Errorf("ssrf: destination %s is not in the allowlist", a.IP)
		}
	}

	return d.base.DialContext(ctx, network, dialTarget)
}

func (d *safeDialer) checkHost(ctx context.Context, host string) error {
	if d.allowedHosts[host] || d.matchesWildcard(host) {
		return nil
	}

	if ip := net.ParseIP(host); ip != nil {
		if !d.ipAllowed(ip) {
			if d.mode == ModeAudit {
				log.Warn().Str("host", host).Msg("ssrf: destination not in allowlist (audit mode, allowing)")
				return nil
			}

			return fmt.Errorf("ssrf: destination %s is not in the allowlist", ip)
		}

		return nil
	}

	resolved, err := net.DefaultResolver.LookupIPAddr(ctx, host)
	if err != nil {
		return fmt.Errorf("ssrf: resolving %q: %w", host, err)
	}

	if len(resolved) == 0 {
		return fmt.Errorf("ssrf: no addresses resolved for %q", host)
	}

	for _, a := range resolved {
		if !d.ipAllowed(a.IP) {
			if d.mode == ModeAudit {
				log.Warn().Str("host", host).Str("ip", a.IP.String()).Msg("ssrf: destination not in allowlist (audit mode, allowing)")
				continue
			}

			return fmt.Errorf("ssrf: destination %s is not in the allowlist", a.IP)
		}
	}

	return nil
}

func (d *safeDialer) matchesWildcard(host string) bool {
	for _, suffix := range d.allowedWilds {
		if strings.HasSuffix(host, suffix) {
			return true
		}
	}

	return false
}

func (d *safeDialer) ipAllowed(ip net.IP) bool {
	for _, network := range d.allowedNets {
		if network.Contains(ip) {
			return true
		}
	}

	return false
}
