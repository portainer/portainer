package templates

import (
	"errors"
	"net/http"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/rs/zerolog/log"
)

type filePayload struct {
	// URL of a git repository where the file is stored
	RepositoryURL string `example:"https://github.com/portainer/portainer-compose" validate:"required"`
	// Path to the file inside the git repository
	ComposeFilePathInRepository string `example:"./subfolder/docker-compose.yml" validate:"required"`
}

func (payload *filePayload) Validate(r *http.Request) error {
	if len(payload.RepositoryURL) == 0 {
		return errors.New("Invalid repository url")
	}

	if len(payload.ComposeFilePathInRepository) == 0 {
		return errors.New("Invalid file path")
	}

	return nil
}

func (handler *Handler) ifRequestedTemplateExists(payload *filePayload) *httperror.HandlerError {
	response, httpErr := handler.fetchTemplates()
	if httpErr != nil {
		return httpErr
	}

	for _, t := range response.Templates {
		if t.Repository.URL == payload.RepositoryURL && t.Repository.StackFile == payload.ComposeFilePathInRepository {
			return nil
		}
	}
	return httperror.InternalServerError("Invalid template", errors.New("requested template does not exist"))
}

// @id TemplateFileOld
// @summary Get a template's file
// @deprecated
// @description Get a template's file
// @description **Access policy**: authenticated
// @tags templates
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param body body filePayload true "File details"
// @success 200 {object} fileResponse "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /templates/file [post]
func (handler *Handler) templateFileOld(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	log.Warn().Msg("This api is deprecated. Please use /templates/{id}/file instead")

	var payload filePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	if err := handler.ifRequestedTemplateExists(&payload); err != nil {
		return err
	}

	projectPath, err := handler.FileService.GetTemporaryPath()
	if err != nil {
		return httperror.InternalServerError("Unable to create temporary folder", err)
	}

	defer handler.cleanUp(projectPath)

	err = handler.GitService.CloneRepository(projectPath, payload.RepositoryURL, "", "", "", false)
	if err != nil {
		return httperror.InternalServerError("Unable to clone git repository", err)
	}

	fileContent, err := handler.FileService.GetFileContent(projectPath, payload.ComposeFilePathInRepository)
	if err != nil {
		return httperror.InternalServerError("Failed loading file content", err)
	}

	return response.JSON(w, fileResponse{FileContent: string(fileContent)})

}
