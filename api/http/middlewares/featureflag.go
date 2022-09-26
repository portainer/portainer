package middlewares

import (
	"net/http"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

func FeatureFlag(settingsService dataservices.SettingsService, feature portainer.Feature) mux.MiddlewareFunc {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(rw http.ResponseWriter, request *http.Request) {
			enabled := settingsService.IsFeatureFlagEnabled(feature)

			if !enabled {
				httperror.WriteError(rw, http.StatusForbidden, "This feature is not enabled", nil)
				return
			}

			next.ServeHTTP(rw, request)
		})
	}
}
