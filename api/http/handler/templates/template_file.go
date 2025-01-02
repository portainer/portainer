package templates

import (
	"net/http"
	"slices"

	portainer "github.com/portainer/portainer/api"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"

	"github.com/rs/zerolog/log"
)

type fileResponse struct {
	// The requested file content
	FileContent string `example:"version:2"`
}

// @id TemplateFile
// @summary Get a template's file
// @description Get a template's file
// @description **Access policy**: authenticated
// @tags templates
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Template identifier"
// @success 200 {object} fileResponse "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /templates/{id}/file [post]
func (handler *Handler) templateFile(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	id, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid template identifier", err)
	}

	templatesResponse, httpErr := handler.fetchTemplates()
	if httpErr != nil {
		return httpErr
	}

	templateIdx := slices.IndexFunc(templatesResponse.Templates, func(template portainer.Template) bool {
		return template.ID == portainer.TemplateID(id)
	})

	if templateIdx == -1 {
		return httperror.NotFound("Unable to find a template with the specified identifier", nil)
	}

	template := templatesResponse.Templates[templateIdx]

	if template.Type == portainer.ContainerTemplate {
		return httperror.BadRequest("Invalid template type", nil)
	}

	if template.StackFile != "" {
		return response.JSON(w, fileResponse{FileContent: template.StackFile})
	}

	if template.Repository.StackFile == "" || template.Repository.URL == "" {
		return httperror.BadRequest("Invalid template configuration", nil)
	}

	projectPath, err := handler.FileService.GetTemporaryPath()
	if err != nil {
		return httperror.InternalServerError("Unable to create temporary folder", err)
	}

	defer handler.cleanUp(projectPath)

	if err := handler.GitService.CloneRepository(projectPath, template.Repository.URL, "", "", "", false); err != nil {
		return httperror.InternalServerError("Unable to clone git repository", err)
	}

	fileContent, err := handler.FileService.GetFileContent(projectPath, template.Repository.StackFile)
	if err != nil {
		return httperror.InternalServerError("Failed loading file content", err)
	}

	return response.JSON(w, fileResponse{FileContent: string(fileContent)})
}

func (handler *Handler) cleanUp(projectPath string) {
	if err := handler.FileService.RemoveDirectory(projectPath); err != nil {
		log.Debug().Err(err).Msg("HTTP error: unable to cleanup stack creation")
	}
}
