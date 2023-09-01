package middlewares

import (
	"net/http"

	"github.com/portainer/portainer/api/http/errors"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"

	"github.com/gorilla/mux"
)

// restrict functionality on demo environments
func RestrictDemoEnv(isDemo func() bool) mux.MiddlewareFunc {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !isDemo() {
				next.ServeHTTP(w, r)
				return
			}

			httperror.WriteError(w, http.StatusBadRequest, errors.ErrNotAvailableInDemo.Error(), errors.ErrNotAvailableInDemo)
		})
	}
}
