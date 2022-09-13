package teams

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
)

// @id TeamList
// @summary List teams
// @description List teams. For non-administrator users, will only list the teams they are member of.
// @description **Access policy**: restricted
// @tags teams
// @param onlyLedTeams query boolean false "Only list teams that the user is leader of"
// @param environmentId query int false "Identifier of the environment(endpoint) that will be used to filter the authorized teams"
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

	var userTeams []portainer.Team
	if onlyLedTeams {
		userTeams = security.FilterLeaderTeams(teams, securityContext)
	} else {
		userTeams = security.FilterUserTeams(teams, securityContext)
	}

	endpointID, _ := request.RetrieveNumericQueryParameter(r, "environmentId", true)
	if endpointID == 0 {
		return response.JSON(w, userTeams)
	}

	// filter out teams who do not have access to the specific endpoint
	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve endpoint from the database", err)
	}

	endpointGroup, err := handler.DataStore.EndpointGroup().EndpointGroup(endpoint.GroupID)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve environment groups from the database", err)
	}

	allowedTeams := make(map[portainer.TeamID]struct{})
	for teamID := range endpointGroup.TeamAccessPolicies {
		allowedTeams[teamID] = struct{}{}
	}
	for teamID := range endpoint.TeamAccessPolicies {
		allowedTeams[teamID] = struct{}{}
	}

	listableTeams := make([]portainer.Team, 0)
	for _, team := range userTeams {
		if _, ok := allowedTeams[team.ID]; ok {
			listableTeams = append(listableTeams, team)
		}
	}
	return response.JSON(w, listableTeams)
}
