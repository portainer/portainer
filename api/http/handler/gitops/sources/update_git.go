package sources

import (
	"errors"
	"net/http"
	"strings"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/gitops/workflows"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

var (
	ErrNotGitSource       = errors.New("source is not a Git source")
	ErrDuplicateSourceURL = errors.New("a source with this URL already exists")
)

// GitSourceUpdatePayload holds the parameters for creating a git-backed source
type GitSourceUpdatePayload struct {
	Name           *string                         `json:"name"`
	URL            *string                         `json:"url"`
	ReferenceName  *string                         `json:"referenceName"`
	TLSSkipVerify  *bool                           `json:"tlsSkipVerify"`
	Authentication *GitAuthenticationUpdatePayload `json:"authentication"`
}

type GitAuthenticationUpdatePayload struct {
	Username          *string                         `json:"username"`
	Password          *string                         `json:"password"`
	Provider          *gittypes.GitProvider           `json:"provider" swaggertype:"integer" enums:"0,1,2,3,4,5,6"`
	AuthorizationType *gittypes.GitCredentialAuthType `json:"authorizationType" swaggertype:"integer" enums:"0,1"`
}

// Validate implements the portainer.Validatable interface
func (payload *GitSourceUpdatePayload) Validate(_ *http.Request) error {
	return nil
}

// @id GitOpsSourcesUpdateGit
// @summary Update a Git source
// @description Updates an existing GitOps source backed by a Git repository.
// @description **Access policy**: admin
// @tags gitops
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Source identifier"
// @param body body GitSourceUpdatePayload true "Git source details"
// @success 200 {object} portainer.Source
// @failure 400 "Invalid request payload"
// @failure 403 "Access denied"
// @failure 404 "Source not found"
// @failure 409 "A source with this URL already exists"
// @failure 500 "Server error"
// @router /gitops/sources/{id} [put]
func (h *Handler) gitSourceUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	id, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid source identifier route variable", err)
	}

	var payload GitSourceUpdatePayload

	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	sourceID := portainer.SourceID(id)

	var src *portainer.Source

	if err := h.dataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		var err error

		if payload.URL != nil {
			if isUnique, err := workflows.ValidateUniqueSourceURL(tx, *payload.URL, sourceID); err != nil {
				return err
			} else if !isUnique {
				return ErrDuplicateSourceURL
			}
		}

		if src, err = tx.Source().Read(sourceID); err != nil {
			return err
		}

		if err := ApplyGitSourceChanges(src, payload); err != nil {
			return err
		}

		return tx.Source().Update(src.ID, src)
	}); h.dataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find a source with the specified identifier", err)
	} else if errors.Is(err, ErrNotGitSource) {
		return httperror.BadRequest("Source is not a Git source", err)
	} else if errors.Is(err, ErrDuplicateSourceURL) {
		return httperror.Conflict("A source with this URL already exists", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to update source", err)
	}

	src.Git = gittypes.SanitizeRepoConfig(src.Git)

	return response.JSON(w, src)
}

// ApplyGitSourceChanges applies the payload changes to the source in place
func ApplyGitSourceChanges(src *portainer.Source, payload GitSourceUpdatePayload) error {
	if src.Type != portainer.SourceTypeGit {
		return ErrNotGitSource
	}

	if payload.Name != nil && strings.TrimSpace(*payload.Name) != "" {
		src.Name = *payload.Name
	}

	gitConfig := src.Git
	if gitConfig == nil {
		gitConfig = &gittypes.RepoConfig{}
	}

	if payload.URL != nil {
		gitConfig.URL = *payload.URL
	}

	if payload.ReferenceName != nil {
		gitConfig.ReferenceName = *payload.ReferenceName
	}

	if payload.TLSSkipVerify != nil {
		gitConfig.TLSSkipVerify = *payload.TLSSkipVerify
	}

	var auth *gittypes.GitAuthentication
	if payload.Authentication == nil {
		auth = gitConfig.Authentication
	} else if *payload.Authentication != (GitAuthenticationUpdatePayload{}) {
		existing := gitConfig.Authentication
		if existing != nil {
			copied := *existing
			auth = &copied
		} else {
			auth = &gittypes.GitAuthentication{}
		}

		authPayload := *payload.Authentication
		if authPayload.AuthorizationType != nil {
			auth.AuthorizationType = *authPayload.AuthorizationType
		}

		if authPayload.Username != nil {
			auth.Username = *authPayload.Username
		}

		if authPayload.Password != nil {
			auth.Password = *authPayload.Password
		}

		if authPayload.Provider != nil {
			auth.Provider = *authPayload.Provider
		}
	}

	gitConfig.Authentication = auth
	src.Git = gitConfig

	return nil
}
