package middlewares

import (
	"net/http"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/rs/zerolog/log"
)

// deprecate api route
func Deprecated(router http.Handler, urlBuilder func(w http.ResponseWriter, r *http.Request) (string, *httperror.HandlerError)) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		newUrl, err := urlBuilder(w, r)
		if err != nil {
			httperror.WriteError(w, err.StatusCode, err.Error(), err)
			return
		}

		if newUrl == "" {
			log.Warn().Msg("This api is deprecated.")
			router.ServeHTTP(w, r)
			return
		}

		log.Warn().Str("new_url", newUrl).Msg("this API endpoint is deprecated")

		redirectedRequest := r.Clone(r.Context())
		redirectedRequest.URL.Path = newUrl
		router.ServeHTTP(w, redirectedRequest)
	})
}

// DeprecatedSimple is a middleware that marks an API route as deprecated
//
// if needed, use Deprecated with a custom urlBuilder
func DeprecatedSimple(h http.Handler) http.Handler {
	return Deprecated(h, func(w http.ResponseWriter, r *http.Request) (string, *httperror.HandlerError) {
		return "", nil
	})
}
