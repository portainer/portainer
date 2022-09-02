package users

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
)

// @id UserList
// @summary List users
// @description List Portainer users.
// @description Non-administrator users will only be able to list other non-administrator user accounts.
// @description User passwords are filtered out, and should never be accessible.
// @description **Access policy**: restricted
// @tags users
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param endpointId query int false "Identifier of the environment(endpoint) that will be used to filter the authorized users"
// @success 200 {array} portainer.User "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /users [get]
func (handler *Handler) userList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	users, err := handler.DataStore.User().Users()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve users from the database", err)
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	filteredUsers := security.FilterUsers(users, securityContext)

	for idx := range filteredUsers {
		hideFields(&filteredUsers[idx])
	}

	ret := make([]portainer.User, 0)
	endpointID, _ := request.RetrieveNumericQueryParameter(r, "endpointId", true)
	if endpointID != 0 {
		// filter out users who do not have access to the specific endpoint
		endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve endpoint from the database", err)
		}

		endpointGroup, err := handler.DataStore.EndpointGroup().EndpointGroup(endpoint.GroupID)
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve environment groups from the database", err)
		}
		for _, user := range filteredUsers {
			// the user inherits the endpoint access from team or environment group
			teamMemberships, err := handler.DataStore.TeamMembership().TeamMembershipsByUserID(user.ID)
			if err != nil {
				return httperror.InternalServerError("Unable to retrieve team membership from the database", err)
			}

			if security.AuthorizedEndpointAccess(endpoint, endpointGroup, user.ID, teamMemberships) {
				ret = append(ret, user)
				continue
			}
		}
		return response.JSON(w, ret)
	}
	return response.JSON(w, filteredUsers)
}
