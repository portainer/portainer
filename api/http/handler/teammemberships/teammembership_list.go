package teammemberships

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
)

// @id TeamMembershipList
// @summary List team memberships
// @description  List team memberships. Access is only available to administrators and team leaders.
// @description **Access policy**: administrator
// @tags team_memberships
// @security ApiKeyAuth
// @security jwt
// @produce json
// @success 200 {array} portainer.TeamMembership "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied"
// @failure 500 "Server error"
// @router /team_memberships [get]
func (handler *Handler) teamMembershipList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	memberships, err := handler.DataStore.TeamMembership().TeamMemberships()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve team memberships from the database", err}
	}

	return response.JSON(w, memberships)
}
