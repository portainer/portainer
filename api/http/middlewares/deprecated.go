package middlewares

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/rs/zerolog/log"
)

// deprecate api route
func Deprecated(urlBuilder func(w http.ResponseWriter, r *http.Request) (string, *httperror.HandlerError)) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		url, err := urlBuilder(w, r)
		if err != nil {
			httperror.WriteError(w, err.StatusCode, err.Error(), err)
			return
		}

		log.Warn().Msgf("This api is deprecated. Use %s instead", url)

		http.Redirect(w, r, url, http.StatusMovedPermanently)
	})
}
