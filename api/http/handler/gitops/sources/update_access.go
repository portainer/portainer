package sources

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/dataservices/source"
	"github.com/portainer/portainer/api/http/security"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

type SourceAccessUpdatePayload struct {
	Public bool               `json:"public"`
	Users  []portainer.UserID `json:"users,omitempty"`
	Teams  []portainer.TeamID `json:"teams,omitempty"`
}

// @id GitOpsSourcesUpdateAccess
// @summary Update a GitOps source's access control
// @description Updates the access control settings for an existing GitOps source.
// @description **Access policy**: administrator
// @tags gitops
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Source identifier"
// @param body body SourceAccessUpdatePayload true "Source access control"
// @success 200 {object} portainer.Source
// @failure 400 "Invalid request payload"
// @failure 403 "Access denied"
// @failure 404 "Source not found"
// @failure 500 "Server error"
// @router /gitops/sources/{id}/access [put]
func (h *Handler) gitSourceUpdateAccess(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	id, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid source identifier route variable", err)
	}

	var payload SourceAccessUpdatePayload

	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	sourceID := portainer.SourceID(id)

	var src *portainer.Source

	if err := h.dataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		var err error

		userContext := source.NewUserContext(securityContext.User, securityContext.UserMemberships)
		if src, err = tx.Source().Read(userContext, sourceID); err != nil {
			return err
		}

		ApplySourceAccessChanges(src, payload)

		return tx.Source().Update(userContext, src.ID, src)
	}); h.dataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find a source with the specified identifier", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to update source access", err)
	}

	return response.JSON(w, src)
}

// Validate implements the portainer.Validatable interface
func (payload *SourceAccessUpdatePayload) Validate(_ *http.Request) error {
	return nil
}

// ApplySourceAccessChanges applies the payload access changes to the source in place.
func ApplySourceAccessChanges(src *portainer.Source, payload SourceAccessUpdatePayload) {
	src.Public = payload.Public

	if payload.Public {
		src.AdministratorsOnly = false
		src.UserAccesses = []portainer.UserID{}
		src.TeamAccesses = []portainer.TeamID{}
	} else if len(payload.Users) == 0 && len(payload.Teams) == 0 {
		src.AdministratorsOnly = true
		src.UserAccesses = []portainer.UserID{}
		src.TeamAccesses = []portainer.TeamID{}
	} else {
		src.AdministratorsOnly = false
		src.UserAccesses = payload.Users
		src.TeamAccesses = payload.Teams
	}
}
