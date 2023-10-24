package csrf

import (
	"crypto/rand"
	"fmt"
	"net/http"

	gorillacsrf "github.com/gorilla/csrf"
	"github.com/portainer/portainer/api/http/security"
)

func WithProtect(handler http.Handler) (http.Handler, error) {
	handler = withSendCSRFToken(handler)

	token := make([]byte, 32)
	_, err := rand.Read(token)
	if err != nil {
		return nil, fmt.Errorf("failed to generate CSRF token: %w", err)
	}

	handler = gorillacsrf.Protect([]byte(token), gorillacsrf.Path("/"))(handler)

	return withSkipCSRF(handler), nil
}

func withSendCSRFToken(handler http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		csrfToken := gorillacsrf.Token(r)
		w.Header().Set("X-CSRF-Token", csrfToken)
		handler.ServeHTTP(w, r)
	})
}

func withSkipCSRF(handler http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		if security.ShouldSkipCSRFCheck(r) {
			r = gorillacsrf.UnsafeSkipCheck(r)
		}

		handler.ServeHTTP(w, r)
	})
}
