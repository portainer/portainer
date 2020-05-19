package templates

import (
	"io"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
)

// GET request on /api/templates
func (handler *Handler) templateList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve settings from the database", err}
	}

	resp, err := http.Get(settings.TemplatesURL)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve templates via the network", err}
	}
	defer resp.Body.Close()

	w.Header().Set("Content-Type", "application/json")
	_, err = io.Copy(w, resp.Body)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to write templates from templates URL", err}
	}

	return nil
}
