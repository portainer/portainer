package middlewares

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/rs/zerolog/log"
)

// deprecate api route
func Deprecated(urlBuilder func(w http.ResponseWriter, r *http.Request) (string, *httperror.HandlerError), router http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		newUrl, err := urlBuilder(w, r)
		if err != nil {
			httperror.WriteError(w, err.StatusCode, err.Error(), err)
			return
		}

		log.Warn().Msgf("This api is deprecated. Use %s instead", newUrl)

		redirectedRequest := r.Clone(r.Context())
		redirectedRequest.URL.Path = newUrl
		router.ServeHTTP(w, redirectedRequest)
	})
}
