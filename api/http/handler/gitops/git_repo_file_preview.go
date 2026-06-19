package gitops

import (
	"context"
	"errors"
	"fmt"
	"net/http"

	portainer "github.com/portainer/portainer/api"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/gitops/sources"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/portainer/portainer/pkg/libhttp/ssrf"
	"github.com/portainer/portainer/pkg/validate"
	"github.com/rs/zerolog/log"
)

type fileResponse struct {
	FileContent string
}

type repositoryFilePreviewPayload struct {
	// SourceID resolves URL and auth from the stored Source record.
	// When set, the inline Repository/Username/Password/TLSSkipVerify fields are ignored.
	SourceID  portainer.SourceID `json:"sourceID" example:"1"`
	Reference string             `json:"reference" example:"refs/heads/master"`
	// Path to file whose content will be read
	TargetFile string `json:"targetFile" example:"docker-compose.yml"`

	// URL of a Git repository to preview.
	// Deprecated: use SourceID instead
	Repository string `json:"repository" example:"https://github.com/openfaas/faas"`
	// Username for git authentication.
	// Deprecated: use SourceID instead
	Username string `json:"username" example:"myGitUsername"`
	// Password for git authentication.
	// Deprecated: use SourceID instead
	Password string `json:"password" example:"myGitPassword"`
	// TLSSkipVerify skips SSL verification when cloning the Git repository.
	// Deprecated: use SourceID instead
	TLSSkipVerify bool `json:"tlsSkipVerify" example:"false"`
}

func (payload *repositoryFilePreviewPayload) Validate(r *http.Request) error {
	if payload.SourceID == 0 {
		if len(payload.Repository) == 0 || !validate.IsURL(payload.Repository) {
			return errors.New("invalid repository URL. Must correspond to a valid URL format")
		}
	}

	if len(payload.Reference) == 0 {
		payload.Reference = "refs/heads/main"
	}

	if len(payload.TargetFile) == 0 {
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
// @failure 404 "Source not found"
// @failure 500 "Server error"
// @router /gitops/repo/file/preview [post]
func (handler *Handler) gitOperationRepoFilePreview(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload repositoryFilePreviewPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	repoURL := payload.Repository
	username := payload.Username
	password := payload.Password
	tlsSkipVerify := payload.TLSSkipVerify

	if payload.SourceID != 0 {
		src, httpErr := sources.ValidateGitSourceAccess(handler.dataStore, payload.SourceID)
		if httpErr != nil {
			return httpErr
		}

		repoURL = src.Git.URL
		if src.Git.Authentication != nil {
			username = src.Git.Authentication.Username
			password = src.Git.Authentication.Password
		}
		tlsSkipVerify = src.Git.TLSSkipVerify
	}

	if err := ssrf.CheckURL(r.Context(), repoURL); err != nil {
		return httperror.BadRequest("Repository URL blocked by SSRF policy", err)
	}

	projectPath, err := handler.fileService.GetTemporaryPath()
	if err != nil {
		return httperror.InternalServerError("Unable to create temporary folder", err)
	}

	err = handler.gitService.CloneRepository(
		context.TODO(),
		projectPath,
		repoURL,
		payload.Reference,
		username,
		password,
		tlsSkipVerify,
	)
	if err != nil {
		if errors.Is(err, gittypes.ErrAuthenticationFailure) {
			return httperror.BadRequest("Invalid git credential", err)
		}

		newErr := fmt.Errorf("unable to clone git repository, error: %w", err)
		return httperror.InternalServerError(newErr.Error(), newErr)
	}

	defer func() {
		if err := handler.fileService.RemoveDirectory(projectPath); err != nil {
			log.Warn().Err(err).Msg("failed to remove temporary project folder")
		}
	}()

	fileContent, err := handler.fileService.GetFileContent(projectPath, payload.TargetFile)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve custom template file from disk", err)
	}

	return response.JSON(w, &fileResponse{FileContent: string(fileContent)})
}
