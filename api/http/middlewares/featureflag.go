package middlewares

import (
	"net/http"

	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/pkg/featureflags"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"

	"github.com/gorilla/mux"
)

func FeatureFlag(settingsService dataservices.SettingsService, feature featureflags.Feature) mux.MiddlewareFunc {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(rw http.ResponseWriter, request *http.Request) {
			enabled := featureflags.IsEnabled(feature)

			if !enabled {
				httperror.WriteError(rw, http.StatusForbidden, "This feature is not enabled", nil)
				return
			}

			next.ServeHTTP(rw, request)
		})
	}
}
