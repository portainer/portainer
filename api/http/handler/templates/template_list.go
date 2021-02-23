package templates

import (
	"io"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"
)

// introduced for swagger
type listResponse struct {
	Version   string
	Templates []portainer.Template
}

// @id TemplateList
// @summary List available templates
// @description List available templates.
// @description **Access policy**: restricted
// @tags templates
// @security jwt
// @produce json
// @success 200 {object} listResponse "Success"
// @failure 500 "Server error"
// @router /templates [get]
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
