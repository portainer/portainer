package templates

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
)

type filePayload struct {
	// URL of a git repository where the file is stored
	RepositoryURL string `example:"https://github.com/portainer/portainer-compose" validate:"required"`
	// Path to the file inside the git repository
	ComposeFilePathInRepository string `example:"./subfolder/docker-compose.yml" validate:"required"`
}

type fileResponse struct {
	// The requested file content
	FileContent string `example: "version:2"`
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

func (handler *Handler) ifRequestedTemplateExists(payload *filePayload) *httperror.HandlerError {
	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve settings from the database", err}
	}

	resp, err := http.Get(settings.TemplatesURL)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve templates via the network", err}
	}
	defer resp.Body.Close()

	var templates struct {
		Templates []portainer.Template
	}
	err = json.NewDecoder(resp.Body).Decode(&templates)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to parse template file", err}
	}

	for _, t := range templates.Templates {
		if t.Repository.URL == payload.RepositoryURL && t.Repository.StackFile == payload.ComposeFilePathInRepository {
			return nil
		}
	}
	return &httperror.HandlerError{http.StatusInternalServerError, "Invalid template", errors.New("requested template does not exist")}
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
// @param body body filePayload true "File details"
// @success 200 {object} fileResponse "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /templates/file [post]
func (handler *Handler) templateFile(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload filePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	if err := handler.ifRequestedTemplateExists(&payload); err != nil {
		return err
	}

	projectPath, err := handler.FileService.GetTemporaryPath()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to create temporary folder", err}
	}

	defer handler.cleanUp(projectPath)

	err = handler.GitService.CloneRepository(projectPath, payload.RepositoryURL, "", "", "")
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to clone git repository", err}
	}

	fileContent, err := handler.FileService.GetFileContent(projectPath, payload.ComposeFilePathInRepository)
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
