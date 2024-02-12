package edgetemplates

import (
	"net/http"
	"slices"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/client"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"

	"github.com/segmentio/encoding/json"
)

type templateFileFormat struct {
	Version   string               `json:"version"`
	Templates []portainer.Template `json:"templates"`
}

// @id EdgeTemplateList
// @deprecated
// @summary Fetches the list of Edge Templates
// @description **Access policy**: administrator
// @tags edge_templates
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @success 200 {array} portainer.Template
// @failure 500
// @router /edge_templates [get]
func (handler *Handler) edgeTemplateList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve settings from the database", err)
	}

	url := portainer.DefaultTemplatesURL
	if settings.TemplatesURL != "" {
		url = settings.TemplatesURL
	}

	var templateData []byte
	templateData, err = client.Get(url, 10)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve external templates", err)
	}

	var templateFile templateFileFormat

	err = json.Unmarshal(templateData, &templateFile)
	if err != nil {
		return httperror.InternalServerError("Unable to parse template file", err)
	}

	// We only support version 3 of the template format
	// this is only a temporary fix until we have custom edge templates
	if templateFile.Version != "3" {
		return httperror.InternalServerError("Unsupported template version", nil)
	}

	filteredTemplates := make([]portainer.Template, 0)

	for _, template := range templateFile.Templates {
		if slices.Contains(template.Categories, "edge") && slices.Contains([]portainer.TemplateType{portainer.ComposeStackTemplate, portainer.SwarmStackTemplate}, template.Type) {
			filteredTemplates = append(filteredTemplates, template)
		}
	}

	return response.JSON(w, filteredTemplates)
}
