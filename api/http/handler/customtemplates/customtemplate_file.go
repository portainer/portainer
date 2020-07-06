package customtemplates

import (
	"net/http"
	"path"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

type fileResponse struct {
	FileContent string
}

// GET request on /api/custom_templates/:id/file
func (handler *Handler) customTemplateFile(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	customTemplateID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid custom template identifier route variable", err}
	}

	customTemplate, err := handler.DataStore.CustomTemplate().CustomTemplate(portainer.CustomTemplateID(customTemplateID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a custom template with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a custom template with the specified identifier inside the database", err}
	}

	fileContent, err := handler.FileService.GetFileContent(path.Join(customTemplate.ProjectPath, customTemplate.EntryPoint))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve custom template file from disk", err}
	}

	return response.JSON(w, &fileResponse{FileContent: string(fileContent)})
}
