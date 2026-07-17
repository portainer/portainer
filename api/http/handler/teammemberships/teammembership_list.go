package teammemberships

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @id TeamMembershipList
// @summary List team memberships
// @description  List team memberships. Access is only available to administrators and team leaders. Team leaders only see memberships of teams they lead.
// @description **Access policy**: administrator or team leader
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
	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	var predicates []func(portainer.TeamMembership) bool
	if !securityContext.IsAdmin {
		predicates = append(predicates, security.LeaderTeamMembershipFilter(securityContext))
	}

	memberships, err := handler.DataStore.TeamMembership().ReadAll(predicates...)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve team memberships from the database", err)
	}

	return response.JSON(w, memberships)
}
