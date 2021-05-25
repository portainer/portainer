package teams

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api/http/security"
)

// @id TeamList
// @summary List teams
// @description List teams. For non-administrator users, will only list the teams they are member of.
// @description **Access policy**: restricted
// @tags teams
// @security jwt
// @produce json
// @success 200 {array} portainer.Team "Success"
// @failure 500 "Server error"
// @router /teams [get]
func (handler *Handler) teamList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	teams, err := handler.DataStore.Team().Teams()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve teams from the database", err}
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve info from request context", err}
	}

	filteredTeams := security.FilterUserTeams(teams, securityContext)

	return response.JSON(w, filteredTeams)
}
