package templates

import (
	"net/http"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @id TemplateList
// @summary List available templates
// @description List available templates.
// @description **Access policy**: authenticated
// @tags templates
// @security ApiKeyAuth
// @security jwt
// @produce json
// @success 200 {object} listResponse "Success"
// @failure 500 "Server error"
// @router /templates [get]
func (handler *Handler) templateList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	templates, httpErr := handler.fetchTemplates()
	if httpErr != nil {
		return httpErr
	}

	return response.JSON(w, templates)
}
