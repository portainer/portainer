package teammemberships

import (
	"net/http"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"
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
	memberships, err := handler.DataStore.TeamMembership().ReadAll()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve team memberships from the database", err)
	}

	return response.JSON(w, memberships)
}
