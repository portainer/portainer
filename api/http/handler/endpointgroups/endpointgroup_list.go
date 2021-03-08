package endpointgroups

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api/http/security"
)

// @id EndpointGroupList
// @summary List Endpoint groups
// @description List all endpoint groups based on the current user authorizations. Will
// @description return all endpoint groups if using an administrator account otherwise it will
// @description only return authorized endpoint groups.
// @description **Access policy**: restricted
// @tags endpoint_groups
// @security jwt
// @produce json
// @success 200 {array} portainer.EndpointGroup "Endpoint group"
// @failure 500 "Server error"
// @router /endpoint_groups [get]
func (handler *Handler) endpointGroupList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointGroups, err := handler.DataStore.EndpointGroup().EndpointGroups()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoint groups from the database", err}
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve info from request context", err}
	}

	endpointGroups = security.FilterEndpointGroups(endpointGroups, securityContext)
	return response.JSON(w, endpointGroups)
}
