package ssrf

import (
	"context"
	"errors"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"strings"
	"sync/atomic"

	portainer "github.com/portainer/portainer/api"
	"github.com/rs/zerolog/log"
)

// ParseAllowedHosts parses raw allow list entries into their three canonical
// forms. Accepted formats: exact hostname, wildcard hostname (*.example.com),
// single IP, or CIDR range.
func ParseAllowedHosts(entries []string) portainer.ParsedAllowList {
	nets := make([]*net.IPNet, 0, len(entries))
	hosts := make(map[string]bool, len(entries))
	var wilds []string

	for _, entry := range entries {
		if _, network, err := net.ParseCIDR(entry); err == nil {
			nets = append(nets, network)
			continue
		}

		if ip := net.ParseIP(entry); ip != nil {
			bits := 32
			if ip.To4() == nil {
				bits = 128
			}

			mask := net.CIDRMask(bits, bits)
			nets = append(nets, &net.IPNet{IP: ip.Mask(mask), Mask: mask})

			continue
		}

		if strings.HasPrefix(entry, "*.") {
			wilds = append(wilds, entry[1:]) // "*.foo.com" -> ".foo.com"
			continue
		}

		hosts[entry] = true
	}

	return portainer.ParsedAllowList{Nets: nets, Hosts: hosts, Wilds: wilds}
}

// AllowListService is implemented by the allowlist data service.
// ReadParsed is called on every dial to pick up runtime changes.
type AllowListService interface {
	ReadParsed(id portainer.AllowListKey) (*portainer.ParsedAllowList, error)
}

type dialFunc func(ctx context.Context, network, addr string) (net.Conn, error)

type safeDialer struct {
	service AllowListService
	base    dialFunc
}

var globalDialer atomic.Pointer[safeDialer]

// Configure initializes the global SSRF policy with the allow list data service.
// It captures http.DefaultTransport's own dial function.
func Configure(svc AllowListService) error {
	if svc == nil {
		return errors.New("unable to configure ssrf: service must not be nil")
	}

	baseTransport, ok := http.DefaultTransport.(*http.Transport)
	if !ok {
		return errors.New("unable to configure ssrf: http.DefaultTransport is not an *http.Transport")
	}

	globalDialer.Store(&safeDialer{service: svc, base: baseTransport.DialContext})
	return nil
}

// IsEnabled reports whether SSRF protection is currently active (audit or enforce).
func IsEnabled() bool {
	d := globalDialer.Load()
	if d == nil {
		return false
	}

	allowList, err := d.service.ReadParsed(portainer.AllowListSSRF)
	if err != nil {
		log.Err(err).Msg("unable to check SSRF protection mode")
		return false
	}

	return allowList.Mode != portainer.SSRFModeOff
}

// CheckURL validates rawURL against the active SSRF policy without making a
// connection. Returns nil when protection is disabled or the destination is
// permitted. In audit mode, logs a warning on violations and returns nil.
func CheckURL(ctx context.Context, rawURL string) error {
	d := globalDialer.Load()
	if d == nil {
		return nil
	}

	normalized := rawURL
	if !strings.Contains(normalized, "://") && !strings.HasPrefix(normalized, "//") {
		normalized = "//" + normalized
	}

	u, err := url.Parse(normalized)
	if err != nil {
		return fmt.Errorf("ssrf: invalid URL %q: %w", rawURL, err)
	}

	host := u.Hostname()
	if host == "" {
		return nil
	}

	return d.checkHost(ctx, host)
}

// DialContext resolves addr, validates all resolved IPs against the allowlist policy,
// then dials using d.base with the first resolved IP to prevent DNS rebinding attacks.
func (d *safeDialer) DialContext(ctx context.Context, network, addr string) (net.Conn, error) {
	allowList, err := d.service.ReadParsed(portainer.AllowListSSRF)
	if err != nil {
		return nil, fmt.Errorf("ssrf: reading allow list: %w", err)
	}

	if allowList.Mode == portainer.SSRFModeOff {
		return d.base(ctx, network, addr)
	}

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

	if allowList.Hosts[host] || matchesWildcard(host, allowList.Wilds) {
		return d.base(ctx, network, dialTarget)
	}

	for _, a := range resolved {
		if !ipAllowed(a.IP, allowList.Nets) {
			if allowList.Mode == portainer.SSRFModeAudit {
				log.Warn().Str("host", host).Str("ip", a.IP.String()).Msg("ssrf: destination not in allowlist (audit mode, allowing)")
				continue
			}

			return nil, fmt.Errorf("ssrf: destination %s is not in the allowlist", a.IP)
		}
	}

	return d.base(ctx, network, dialTarget)
}

func (d *safeDialer) checkHost(ctx context.Context, host string) error {
	allowList, err := d.service.ReadParsed(portainer.AllowListSSRF)
	if err != nil {
		return fmt.Errorf("ssrf: reading allow list: %w", err)
	}

	if allowList.Mode == portainer.SSRFModeOff {
		return nil
	}

	if allowList.Hosts[host] || matchesWildcard(host, allowList.Wilds) {
		return nil
	}

	if ip := net.ParseIP(host); ip != nil {
		if !ipAllowed(ip, allowList.Nets) {
			if allowList.Mode == portainer.SSRFModeAudit {
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
		if !ipAllowed(a.IP, allowList.Nets) {
			if allowList.Mode == portainer.SSRFModeAudit {
				log.Warn().Str("host", host).Str("ip", a.IP.String()).Msg("ssrf: destination not in allowlist (audit mode, allowing)")
				continue
			}

			return fmt.Errorf("ssrf: destination %s is not in the allowlist", a.IP)
		}
	}

	return nil
}

func matchesWildcard(host string, wilds []string) bool {
	for _, suffix := range wilds {
		if strings.HasSuffix(host, suffix) {
			return true
		}
	}

	return false
}

func ipAllowed(ip net.IP, nets []*net.IPNet) bool {
	for _, network := range nets {
		if network.Contains(ip) {
			return true
		}
	}

	return false
}
