package edgetemplates

import (
	"encoding/json"
	"log"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/client"
	"github.com/portainer/portainer/api/http/security"
)

// GET request on /api/edgetemplates
func (handler *Handler) edgeTemplateList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {

	var templateData []byte
	templateData, err := client.Get(portainer.EdgeTemplatesURL, 0)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve external templates", err}
	}

	var templates []portainer.Template

	err = json.Unmarshal(templateData, &templates)
	if err != nil {
		log.Printf("[DEBUG] [http,edge,templates] [failed parsing edge templates] [body: %s]", templateData)
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to parse external templates", err}
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve info from request context", err}
	}

	filteredTemplates := []portainer.Template{}

	for _, template := range templates {
		if template.Type == portainer.EdgeStackTemplate {
			filteredTemplates = append(filteredTemplates, template)
		}
	}

	security.FilterTemplates(filteredTemplates, securityContext)

	return response.JSON(w, filteredTemplates)
}
