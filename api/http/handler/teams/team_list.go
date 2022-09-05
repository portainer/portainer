package teams

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api/http/security"
)

// @id TeamList
// @summary List teams
// @description List teams. For non-administrator users, will only list the teams they are member of.
// @description **Access policy**: restricted
// @tags teams
// @param onlyLedTeams query boolean false "Only list teams that the user is leader of"
// @security ApiKeyAuth
// @security jwt
// @produce json
// @success 200 {array} portainer.Team "Success"
// @failure 500 "Server error"
// @router /teams [get]
func (handler *Handler) teamList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	teams, err := handler.DataStore.Team().Teams()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve teams from the database", err)
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	onlyLedTeams, _ := request.RetrieveBooleanQueryParameter(r, "onlyLedTeams", true)

	filteredTeams := teams

	if onlyLedTeams {
		filteredTeams = security.FilterLeaderTeams(filteredTeams, securityContext)
	}

	filteredTeams = security.FilterUserTeams(filteredTeams, securityContext)

	return response.JSON(w, filteredTeams)
}
