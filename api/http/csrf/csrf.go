package csrf

import (
	"fmt"
	"net/http"
	"os"

	"github.com/rs/zerolog/log"
)

func WithProtect(handler http.Handler, trustedOrigins []string) (http.Handler, error) {
	// DOCKER_EXTENSION=1 is set in build/docker-extension/docker-compose.yml
	isDockerDesktopExtension := false
	if val, ok := os.LookupEnv("DOCKER_EXTENSION"); ok && val == "1" {
		isDockerDesktopExtension = true
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

		protected.ServeHTTP(w, r)
	}), nil
}
