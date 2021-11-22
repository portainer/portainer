package intel

import (
	"log"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
)

const openamt_proxy = "openamt"

func (handler *Handler) mpsProxy(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	proxy := handler.ProxyManager.GetGenericProxy(openamt_proxy)
	if proxy == nil {
		settings, err := handler.DataStore.Settings().Settings()
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to create proxy", err}
		}

		mpsServer := settings.OpenAMTConfiguration.MPSURL

		log.Println("mpsServer=", mpsServer)

		proxy, err = handler.ProxyManager.CreateGenericProxy(openamt_proxy, "https://"+mpsServer)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to create proxy", err}
		}
	}

	http.StripPrefix("/open-amt/mps", proxy).ServeHTTP(w, r)
	return nil
}
