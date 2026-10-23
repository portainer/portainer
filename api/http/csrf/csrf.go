package csrf

import (
	"fmt"
	"net/http"
	"os"

	portainer "github.com/portainer/portainer/api"

	"github.com/rs/zerolog/log"
)

func WithProtect(handler http.Handler, trustedOrigins []string) (http.Handler, error) {
	// DOCKER_EXTENSION=1 is set in build/docker-extension/docker-compose.yml
	isDockerDesktopExtension := false
	if val, ok := os.LookupEnv("DOCKER_EXTENSION"); ok && val == "1" {
		isDockerDesktopExtension = true
	}

	allowNoOrigin := false
	if val, ok := os.LookupEnv(portainer.CSRFAllowNoOriginEnvVar); ok && val == "1" {
		allowNoOrigin = true
	}

	cop := http.NewCrossOriginProtection()
	for _, origin := range trustedOrigins {
		if err := cop.AddTrustedOrigin(origin); err != nil {
			return nil, fmt.Errorf("failed to add trusted origin %q: %w", origin, err)
		}
	}

	cop.SetDenyHandler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Error().Err(cop.Check(r)).
			Str("request_url", r.URL.String()).
			Str("host", r.Host).
			Str("origin", r.Header.Get("Origin")).
			Str("sec_fetch_site", r.Header.Get("Sec-Fetch-Site")).
			Strs("trusted_origins", trustedOrigins).
			Msg("CSRF check failed")

		http.Error(w, http.StatusText(http.StatusForbidden), http.StatusForbidden)
	}))

	protected := cop.Handler(handler)

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if isDockerDesktopExtension {
			handler.ServeHTTP(w, r)

			return
		}

		if !allowNoOrigin && isUnsafeCookieRequestWithoutOrigin(r) {
			log.Error().
				Str("request_url", r.URL.String()).
				Str("host", r.Host).
				Str("method", r.Method).
				Msg("CSRF check failed: unsafe cookie-authenticated request without Origin or Sec-Fetch-Site headers, set " + portainer.CSRFAllowNoOriginEnvVar + "=1 to allow such requests")

			http.Error(w, http.StatusText(http.StatusForbidden), http.StatusForbidden)

			return
		}

		protected.ServeHTTP(w, r)
	}), nil
}

// isUnsafeCookieRequestWithoutOrigin reports whether the request uses an unsafe
// method, relies on the session cookie rather than an API key or bearer token,
// and carries no Origin or Sec-Fetch-Site header. CrossOriginProtection assumes
// such requests come from non-browser clients and allows them, but legacy
// browsers and header-stripping proxies can produce them too, so they are
// blocked instead (fail closed).
func isUnsafeCookieRequestWithoutOrigin(r *http.Request) bool {
	switch r.Method {
	case http.MethodGet, http.MethodHead, http.MethodOptions:
		return false
	}

	if r.Header.Get("Origin") != "" || r.Header.Get("Sec-Fetch-Site") != "" {
		return false
	}

	// Token-authenticated clients set these headers explicitly, which a browser
	// never does on its own, so they are not exposed to CSRF.
	if r.Header.Get(portainer.APIKeyHeader) != "" || r.Header.Get("Authorization") != "" {
		return false
	}

	_, err := r.Cookie(portainer.AuthCookieKey)

	return err == nil
}
