package csrf

import (
	"crypto/rand"
	"errors"
	"fmt"
	"net/http"
	"os"

	"github.com/portainer/portainer/api/http/security"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"

	gcsrf "github.com/gorilla/csrf"
	"github.com/rs/zerolog/log"
	"github.com/urfave/negroni"
)

const csrfSkipHeader = "X-CSRF-Token-Skip"

func SkipCSRFToken(w http.ResponseWriter) {
	w.Header().Set(csrfSkipHeader, "1")
}

func WithProtect(handler http.Handler, trustedOrigins []string) (http.Handler, error) {
	// IsDockerDesktopExtension is used to check if we should skip csrf checks in the request bouncer (ShouldSkipCSRFCheck)
	// DOCKER_EXTENSION is set to '1' in build/docker-extension/docker-compose.yml
	isDockerDesktopExtension := false
	if val, ok := os.LookupEnv("DOCKER_EXTENSION"); ok && val == "1" {
		isDockerDesktopExtension = true
	}

	handler = withSendCSRFToken(handler)

	token := make([]byte, 32)
	if _, err := rand.Read(token); err != nil {
		return nil, fmt.Errorf("failed to generate CSRF token: %w", err)
	}

	handler = gcsrf.Protect(
		token,
		gcsrf.Path("/"),
		gcsrf.Secure(false),
		gcsrf.TrustedOrigins(trustedOrigins),
		gcsrf.ErrorHandler(withErrorHandler(trustedOrigins)),
	)(handler)

	return withSkipCSRF(handler, isDockerDesktopExtension), nil
}

func withSendCSRFToken(handler http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sw := negroni.NewResponseWriter(w)

		sw.Before(func(sw negroni.ResponseWriter) {
			if len(sw.Header().Get(csrfSkipHeader)) > 0 {
				sw.Header().Del(csrfSkipHeader)

				return
			}

			if statusCode := sw.Status(); statusCode >= 200 && statusCode < 300 {
				sw.Header().Set("X-CSRF-Token", gcsrf.Token(r))
			}
		})

		handler.ServeHTTP(sw, r)
	})
}

func withSkipCSRF(handler http.Handler, isDockerDesktopExtension bool) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		skip, err := security.ShouldSkipCSRFCheck(r, isDockerDesktopExtension)
		if err != nil {
			httperror.WriteError(w, http.StatusForbidden, err.Error(), err)

			return
		}

		if skip {
			r = gcsrf.UnsafeSkipCheck(r)
		}

		handler.ServeHTTP(w, r)
	})
}

func withErrorHandler(trustedOrigins []string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		err := gcsrf.FailureReason(r)

		if errors.Is(err, gcsrf.ErrBadOrigin) || errors.Is(err, gcsrf.ErrBadReferer) || errors.Is(err, gcsrf.ErrNoReferer) {
			log.Error().Err(err).
				Str("request_url", r.URL.String()).
				Str("host", r.Host).
				Str("x_forwarded_proto", r.Header.Get("X-Forwarded-Proto")).
				Str("forwarded", r.Header.Get("Forwarded")).
				Str("origin", r.Header.Get("Origin")).
				Str("referer", r.Header.Get("Referer")).
				Strs("trusted_origins", trustedOrigins).
				Msg("Failed to validate Origin or Referer")
		}

		http.Error(
			w,
			http.StatusText(http.StatusForbidden)+" - "+err.Error(),
			http.StatusForbidden,
		)
	})
}
