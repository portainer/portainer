package sources

import (
	"errors"
	"net/http"
	"strings"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	gittypes "github.com/portainer/portainer/api/git/types"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// GitAuthenticationPayload holds authentication parameters for a git source
type GitAuthenticationPayload struct {
	Username          string                         `json:"username"`
	Password          string                         `json:"password"`
	Provider          gittypes.GitProvider           `json:"provider"`
	AuthorizationType gittypes.GitCredentialAuthType `json:"authorizationType"`
}

// GitSourceCreatePayload holds the parameters for creating a git-backed source
type GitSourceCreatePayload struct {
	Name           string                    `json:"name"`
	URL            string                    `json:"url" validate:"required"`
	TLSSkipVerify  bool                      `json:"tlsSkipVerify"`
	Authentication *GitAuthenticationPayload `json:"authentication"`
}

// Validate implements the portainer.Validatable interface
func (payload *GitSourceCreatePayload) Validate(_ *http.Request) error {
	if strings.TrimSpace(payload.URL) == "" {
		return errors.New("url is required")
	}

	return nil
}

// BuildGitSource constructs a portainer.Source from a GitSourceCreatePayload
func BuildGitSource(payload GitSourceCreatePayload) *portainer.Source {
	gitConfig := &gittypes.RepoConfig{
		URL:           payload.URL,
		TLSSkipVerify: payload.TLSSkipVerify,
	}

	if payload.Authentication != nil {
		gitConfig.Authentication = &gittypes.GitAuthentication{
			Username:          payload.Authentication.Username,
			Password:          payload.Authentication.Password,
			Provider:          payload.Authentication.Provider,
			AuthorizationType: payload.Authentication.AuthorizationType,
		}
	}

	name := payload.Name
	if strings.TrimSpace(name) == "" {
		name = gittypes.RepoName(payload.URL)
	}

	return &portainer.Source{
		Name: name,
		Type: portainer.SourceTypeGit,
		Git:  gitConfig,
	}
}

// @id GitOpsSourcesCreateGit
// @summary Create a Git source
// @description Creates a new GitOps source backed by a Git repository.
// @description **Access policy**: admin
// @tags gitops
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param body body GitSourceCreatePayload true "Git source details"
// @success 201 {object} portainer.Source
// @failure 400 "Invalid request payload"
// @failure 403 "Access denied"
// @failure 500 "Server error"
// @router /gitops/sources/git [post]
func (h *Handler) gitSourceCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload GitSourceCreatePayload

	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	src := BuildGitSource(payload)

	if err := h.dataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.Source().Create(src)
	}); err != nil {
		return httperror.InternalServerError("Unable to create source", err)
	}

	src.Git = gittypes.SanitizeRepoConfig(src.Git)

	return response.JSONWithStatus(w, src, http.StatusCreated)
}
