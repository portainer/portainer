package templates

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/segmentio/encoding/json"
)

type listResponse struct {
	Version   string               `json:"version"`
	Templates []portainer.Template `json:"templates"`
}

func (handler *Handler) fetchTemplates() (*listResponse, *httperror.HandlerError) {
	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return nil, httperror.InternalServerError("Unable to retrieve settings from the database", err)
	}

	templatesURL := settings.TemplatesURL
	if templatesURL == "" {
		templatesURL = portainer.DefaultTemplatesURL
	}

	resp, err := http.Get(templatesURL)
	if err != nil {
		return nil, httperror.InternalServerError("Unable to retrieve templates via the network", err)
	}
	defer resp.Body.Close()

	var body *listResponse
	err = json.NewDecoder(resp.Body).Decode(&body)
	if err != nil {
		return nil, httperror.InternalServerError("Unable to parse template file", err)
	}

	return body, nil

}
