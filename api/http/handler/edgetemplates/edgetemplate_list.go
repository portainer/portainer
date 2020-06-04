package edgetemplates

import (
	"encoding/json"
	"log"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/client"
)

// GET request on /api/edgetemplates
func (handler *Handler) edgeTemplateList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	settings, err := handler.SettingsService.Settings()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve settings from the database", err}
	}

	url := portainer.EdgeTemplatesURL
	if settings.TemplatesURL != "" {
		url = settings.TemplatesURL
	}

	var templateData []byte
	templateData, err = client.Get(url, 0)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve external templates", err}
	}

	var templates []portainer.Template

	err = json.Unmarshal(templateData, &templates)
	if err != nil {
		log.Printf("[DEBUG] [http,edge,templates] [failed parsing edge templates] [body: %s]", templateData)
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to parse external templates", err}
	}

	filteredTemplates := []portainer.Template{}

	for _, template := range templates {
		if template.Type == portainer.EdgeStackTemplate {
			filteredTemplates = append(filteredTemplates, template)
		}
	}

	return response.JSON(w, filteredTemplates)
}
