package gitops

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	gittypes "github.com/portainer/portainer/api/git/types"
)

type fileResponse struct {
	FileContent string
}

type repositoryFilePreviewPayload struct {
	Repository string `json:"repository" example:"https://github.com/openfaas/faas" validate:"required"`
	Reference  string `json:"reference" example:"refs/heads/master"`
	Username   string `json:"username" example:"myGitUsername"`
	Password   string `json:"password" example:"myGitPassword"`
	// Path to file whose content will be read
	TargetFile string `json:"targetFile" example:"docker-compose.yml"`
	// TLSSkipVerify skips SSL verification when cloning the Git repository
	TLSSkipVerify bool `example:"false"`
}

func (payload *repositoryFilePreviewPayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Repository) || !govalidator.IsURL(payload.Repository) {
		return errors.New("invalid repository URL. Must correspond to a valid URL format")
	}

	if govalidator.IsNull(payload.Reference) {
		payload.Reference = "refs/heads/main"
	}

	if govalidator.IsNull(payload.TargetFile) {
		return errors.New("invalid target filename")
	}

	return nil
}

// @id GitOperationRepoFilePreview
// @summary preview the content of target file in the git repository
// @description Retrieve the compose file content based on git repository configuration
// @description **Access policy**: authenticated
// @tags gitops
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param body body repositoryFilePreviewPayload true "Template details"
// @success 200 {object} fileResponse "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /gitops/repo/file/preview [post]
func (handler *Handler) gitOperationRepoFilePreview(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload repositoryFilePreviewPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	projectPath, err := handler.fileService.GetTemporaryPath()
	if err != nil {
		return httperror.InternalServerError("Unable to create temporary folder", err)
	}

	err = handler.gitService.CloneRepository(projectPath, payload.Repository, payload.Reference, payload.Username, payload.Password, payload.TLSSkipVerify)
	if err != nil {
		if errors.Is(err, gittypes.ErrAuthenticationFailure) {
			return httperror.BadRequest("Invalid git credential", err)
		}

		newErr := fmt.Errorf("unable to clone git repository, error: %w", err)
		return httperror.InternalServerError(newErr.Error(), newErr)
	}

	defer handler.fileService.RemoveDirectory(projectPath)

	fileContent, err := handler.fileService.GetFileContent(projectPath, payload.TargetFile)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve custom template file from disk", err)
	}

	return response.JSON(w, &fileResponse{FileContent: string(fileContent)})
}
