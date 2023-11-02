package users

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
)

type User struct {
	ID       portainer.UserID `json:"Id" example:"1"`
	Username string           `json:"Username" example:"bob"`
	// User role (1 for administrator account and 2 for regular account)
	Role portainer.UserRole `json:"Role" example:"1"`
}

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
// @param environmentId query int false "Identifier of the environment(endpoint) that will be used to filter the authorized users"
// @success 200 {array} portainer.User "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /users [get]
func (handler *Handler) userList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	if !securityContext.IsAdmin && !securityContext.IsTeamLeader {
		return httperror.Forbidden("Permission denied to access users list", err)
	}

	users, err := handler.DataStore.User().ReadAll()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve users from the database", err)
	}

	availableUsers := security.FilterUsers(users, securityContext)

	endpointID, _ := request.RetrieveNumericQueryParameter(r, "environmentId", true)
	if endpointID == 0 {
		return response.JSON(w, sanitizeUsers(availableUsers))
	}

	// filter out users who do not have access to the specific endpoint
	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve endpoint from the database", err)
	}

	endpointGroup, err := handler.DataStore.EndpointGroup().Read(endpoint.GroupID)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve environment groups from the database", err)
	}

	canAccessEndpoint := make([]User, 0)
	for _, user := range availableUsers {
		// the users who have the endpoint authorization
		if _, ok := user.EndpointAuthorizations[endpoint.ID]; ok {
			canAccessEndpoint = append(canAccessEndpoint, sanitizeUser(user))
			continue
		}

		// the user inherits the endpoint access from team or environment group
		teamMemberships, err := handler.DataStore.TeamMembership().TeamMembershipsByUserID(user.ID)
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve team membership from the database", err)
		}

		if security.AuthorizedEndpointAccess(endpoint, endpointGroup, user.ID, teamMemberships) {
			canAccessEndpoint = append(canAccessEndpoint, sanitizeUser(user))
		}
	}

	return response.JSON(w, canAccessEndpoint)
}

func sanitizeUser(user portainer.User) User {
	return User{
		ID:       user.ID,
		Username: user.Username,
		Role:     user.Role,
	}
}

func sanitizeUsers(users []portainer.User) []User {
	u := make([]User, len(users))
	for i := range users {
		u[i] = sanitizeUser(users[i])
	}
	return u
}
