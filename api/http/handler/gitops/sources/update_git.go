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

	"github.com/rs/zerolog/log"
)

var (
	ErrNotGitSource = errors.New("source is not a Git source")
)

// GitSourceUpdatePayload holds the parameters for updating a git-backed source
type GitSourceUpdatePayload struct {
	Name           *string                         `json:"name"`
	URL            *string                         `json:"url"`
	TLSSkipVerify  *bool                           `json:"tlsSkipVerify"`
	Authentication *GitAuthenticationUpdatePayload `json:"authentication"`
	Interval       *string                         `json:"interval"`
}

type GitAuthenticationUpdatePayload struct {
	Username *string `json:"username"`
	Password *string `json:"password"`
}

// Validate implements the portainer.Validatable interface
func (payload *GitSourceUpdatePayload) Validate(_ *http.Request) error {
	if payload.URL != nil && !validate.IsURL(*payload.URL) {
		return errors.New("invalid repository URL. Must correspond to a valid URL format")
	}

	if payload.Interval != nil {
		return validateInterval(*payload.Interval)
	}

	return nil
}

// @id GitOpsSourcesUpdateGit
// @summary Update a Git source
// @description Updates an existing GitOps source backed by a Git repository.
// @description **Access policy**: authenticated
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
// @failure 409 "A source with this URL and credentials already exists"
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

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	sourceID := portainer.SourceID(id)
	userContext := source.NewUserContext(securityContext.User, securityContext.UserMemberships)

	var src *portainer.Source

	if err := h.dataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		var err error

		if src, err = tx.Source().Read(userContext, sourceID); err != nil {
			return err
		}

		if err := ApplyGitSourceChanges(src, payload); err != nil {
			return err
		}

		src.Status = portainer.SourceStatusUnknown
		src.StatusError = ""

		return tx.Source().Update(userContext, src.ID, src)
	}); h.dataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find a source with the specified identifier", err)
	} else if errors.Is(err, ErrNotGitSource) {
		return httperror.BadRequest("Source is not a Git source", err)
	} else if errors.Is(err, source.ErrNotEnoughPermission) {
		return httperror.Forbidden("Not enough permissions to update source", err)
	} else if errors.Is(err, source.ErrDuplicateSource) {
		return httperror.Conflict("A source with this URL and credentials already exists", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to update source", err)
	}

	if src, err = h.testAndSaveSourceConnection(r.Context(), userContext, src); err != nil {
		return httperror.InternalServerError("Unable to persist source status", err)
	}

	if err := h.sourceScheduler.Reconcile(src.ID); err != nil {
		log.Warn().Err(err).Int("source_id", int(src.ID)).Msg("source scheduler reconcile failed after source update")
	}

	src.Git = gittypes.SanitizeGitSource(src.Git)

	return response.JSON(w, src)
}

// ApplyGitSourceChanges applies the payload changes to the source in place
func ApplyGitSourceChanges(src *portainer.Source, payload GitSourceUpdatePayload) error {
	if err := ApplyBaseGitSourceChanges(src, payload); err != nil {
		return err
	}

	if payload.Authentication == nil {
		return nil
	}

	if *payload.Authentication == (GitAuthenticationUpdatePayload{}) {
		src.Git.Authentication = nil
		return nil
	}

	src.Git.Authentication = ApplyAuthChanges(src.Git.Authentication, *payload.Authentication)

	return nil
}

// ApplyBaseGitSourceChanges applies the non-authentication field changes (name,
// URL, reference, TLS) to the source in place, ensuring src.Git is set
func ApplyBaseGitSourceChanges(src *portainer.Source, payload GitSourceUpdatePayload) error {
	if src.Type != portainer.SourceTypeGit {
		return ErrNotGitSource
	}

	if payload.Name != nil && strings.TrimSpace(*payload.Name) != "" {
		src.Name = *payload.Name
	}

	if src.Git == nil {
		src.Git = &gittypes.GitSource{}
	}

	if payload.URL != nil {
		src.Git.URL = *payload.URL
	}

	if payload.TLSSkipVerify != nil {
		src.Git.TLSSkipVerify = *payload.TLSSkipVerify
	}

	if payload.Interval != nil {
		src.Interval = *payload.Interval
	}

	return nil
}

// ApplyAuthChanges returns a copy of the existing authentication (or a fresh
// one) with the basic credential changes applied.
func ApplyAuthChanges(existing *gittypes.GitAuthentication, payload GitAuthenticationUpdatePayload) *gittypes.GitAuthentication {
	auth := &gittypes.GitAuthentication{}
	if existing != nil {
		copied := *existing
		auth = &copied
	}

	if payload.Username != nil {
		auth.Username = *payload.Username
	}

	if payload.Password != nil {
		auth.Password = *payload.Password
	}

	return auth
}
