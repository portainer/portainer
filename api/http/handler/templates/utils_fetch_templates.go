package templates

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	libclient "github.com/portainer/portainer/pkg/libhttp/client"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/rs/zerolog/log"
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

	var body *listResponse
	if err := libclient.ExternalRequestDisabled(templatesURL); err != nil {
		if templatesURL == portainer.DefaultTemplatesURL {
			log.Debug().Err(err).Msg("External request disabled: Default templates")
			return body, nil
		}
	}

	resp, err := http.Get(templatesURL)
	if err != nil {
		return nil, httperror.InternalServerError("Unable to retrieve templates via the network", err)
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			log.Warn().Err(err).Msg("Failed to close templates response body")
		}
	}()

	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return nil, httperror.InternalServerError("Unable to parse template file", err)
	}

	for i := range body.Templates {
		body.Templates[i].ID = portainer.TemplateID(i + 1)
	}
	return body, nil

}
