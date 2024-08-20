package csrf

import (
	"crypto/rand"
	"fmt"
	"net/http"
	"os"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"

	gorillacsrf "github.com/gorilla/csrf"
	"github.com/urfave/negroni"
)

func WithProtect(handler http.Handler) (http.Handler, error) {
	// IsDockerDesktopExtension is used to check if we should skip csrf checks in the request bouncer (ShouldSkipCSRFCheck)
	// DOCKER_EXTENSION is set to '1' in build/docker-extension/docker-compose.yml
	if val, ok := os.LookupEnv("DOCKER_EXTENSION"); ok && val == "1" {
		portainer.IsDockerDesktopExtension = true
	}

	handler = withSendCSRFToken(handler)

	token := make([]byte, 32)
	if _, err := rand.Read(token); err != nil {
		return nil, fmt.Errorf("failed to generate CSRF token: %w", err)
	}

	handler = gorillacsrf.Protect(
		token,
		gorillacsrf.Path("/"),
		gorillacsrf.Secure(false),
	)(handler)

	return withSkipCSRF(handler), nil
}

func withSendCSRFToken(handler http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sw := negroni.NewResponseWriter(w)

		sw.Before(func(sw negroni.ResponseWriter) {
			statusCode := sw.Status()
			if statusCode >= 200 && statusCode < 300 {
				csrfToken := gorillacsrf.Token(r)
				sw.Header().Set("X-CSRF-Token", csrfToken)
			}
		})

		handler.ServeHTTP(sw, r)
	})
}

func withSkipCSRF(handler http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		skip, err := security.ShouldSkipCSRFCheck(r)
		if err != nil {
			httperror.WriteError(w, http.StatusForbidden, err.Error(), err)

			return
		}

		if skip {
			r = gorillacsrf.UnsafeSkipCheck(r)
		}

		handler.ServeHTTP(w, r)
	})
}
