package sources

import (
	"errors"
	"net/http"
	"strings"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/dataservices/source"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/http/security"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/portainer/portainer/pkg/validate"
)

// GitAuthenticationPayload holds authentication parameters for a git source
type GitAuthenticationPayload struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type SourceAccessControlPayload struct {
	Public             bool               `json:"public" example:"true"`
	AdministratorsOnly bool               `json:"administratorsOnly" example:"true"`
	UserAccesses       []portainer.UserID `json:"userAccesses"`
	TeamAccesses       []portainer.TeamID `json:"teamAccesses"`
}

// GitSourceCreatePayload holds the parameters for creating a git-backed source
type GitSourceCreatePayload struct {
	SourceAccessControlPayload
	Name           string                    `json:"name"`
	URL            string                    `json:"url" validate:"required"`
	TLSSkipVerify  bool                      `json:"tlsSkipVerify"`
	Authentication *GitAuthenticationPayload `json:"authentication"`
}

// Validate implements the portainer.Validatable interface
func (payload *GitSourceCreatePayload) Validate(_ *http.Request) error {
	if !validate.IsURL(payload.URL) {
		return errors.New("invalid repository URL. Must correspond to a valid URL format")
	}

	return nil
}

// @id GitOpsSourcesCreateGit
// @summary Create a Git source
// @description Creates a new GitOps source backed by a Git repository.
// @description **Access policy**: authenticated
// @tags gitops
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param body body GitSourceCreatePayload true "Git source details"
// @success 201 {object} portainer.Source
// @failure 400 "Invalid request payload"
// @failure 403 "Access denied"
// @failure 409 "A source with this URL and credentials already exists"
// @failure 500 "Server error"
// @router /gitops/sources/git [post]
func (h *Handler) gitSourceCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload GitSourceCreatePayload

	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	src, err := BuildGitSource(payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	if err := h.dataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		userContext := source.NewUserContext(securityContext.User, securityContext.UserMemberships)
		return tx.Source().Create(userContext, src)
	}); errors.Is(err, source.ErrDuplicateSource) {
		return httperror.Conflict("A source with this URL and credentials already exists", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to create source", err)
	}

	src.Git = gittypes.SanitizeRepoConfig(src.Git)

	return response.JSONWithStatus(w, src, http.StatusCreated)
}

// BuildGitSource constructs a portainer.Source from a GitSourceCreatePayload
func BuildGitSource(payload GitSourceCreatePayload) (*portainer.Source, error) {
	src := BuildBaseGitSource(payload)
	src.Git.Authentication = BuildAuth(payload.Authentication)

	return src, nil
}

// BuildBaseGitSource constructs the source skeleton (name, URL, TLS, accesses) without authentication.
func BuildBaseGitSource(payload GitSourceCreatePayload) *portainer.Source {
	name := payload.Name
	if strings.TrimSpace(name) == "" {
		name = gittypes.RepoName(payload.URL)
	}

	return &portainer.Source{
		Name: name,
		Type: portainer.SourceTypeGit,
		Git: &gittypes.RepoConfig{
			URL:           payload.URL,
			TLSSkipVerify: payload.TLSSkipVerify,
		},
		UserAccesses:       payload.UserAccesses,
		TeamAccesses:       payload.TeamAccesses,
		Public:             payload.Public,
		AdministratorsOnly: payload.AdministratorsOnly,
	}
}

// BuildAuth constructs basic git authentication from the payload, returning nil
// when no authentication is provided.
func BuildAuth(payload *GitAuthenticationPayload) *gittypes.GitAuthentication {
	if payload == nil {
		return nil
	}

	return &gittypes.GitAuthentication{
		Username: payload.Username,
		Password: payload.Password,
	}
}
