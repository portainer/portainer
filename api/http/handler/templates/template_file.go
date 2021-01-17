package templates

import (
	"errors"
	"log"
	"net/http"
	"path"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
)

type filePayload struct {
	RepositoryURL               string
	ComposeFilePathInRepository string
}

type fileResponse struct {
	FileContent string
}

func (payload *filePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.RepositoryURL) {
		return errors.New("Invalid repository url")
	}

	if govalidator.IsNull(payload.ComposeFilePathInRepository) {
		return errors.New("Invalid file path")
	}

	return nil
}

// @summary Get a template's file
// @description
// @tags templates
// @security ApiKeyAuth
// @accept json
// @produce json
// @param body body filePayload true "File data"
// @success 200 {object} fileResponse
// @failure 400,500
// @router /templates/file [post]
func (handler *Handler) templateFile(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload filePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	projectPath, err := handler.FileService.GetTemporaryPath()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to create temporary folder", err}
	}

	defer handler.cleanUp(projectPath)

	gitCloneParams := &cloneRepositoryParameters{
		url:  payload.RepositoryURL,
		path: projectPath,
	}

	err = handler.cloneGitRepository(gitCloneParams)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to clone git repository", err}
	}

	composeFilePath := path.Join(projectPath, payload.ComposeFilePathInRepository)

	fileContent, err := handler.FileService.GetFileContent(composeFilePath)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Failed loading file content", err}
	}

	return response.JSON(w, fileResponse{FileContent: string(fileContent)})

}

func (handler *Handler) cleanUp(projectPath string) error {
	err := handler.FileService.RemoveDirectory(projectPath)
	if err != nil {
		log.Printf("http error: Unable to cleanup stack creation (err=%s)\n", err)
	}
	return nil
}
