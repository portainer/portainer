package endpoints

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/set"
)

// @id AgentVersions
// @summary List agent versions
// @description List all agent versions based on the current user authorizations and query parameters.
// @description **Access policy**: restricted
// @tags endpoints
// @security ApiKeyAuth
// @security jwt
// @produce json
// @success 200 {array} string "List of available agent versions"
// @failure 500 "Server error"
// @router /endpoints/agent_versions [get]

func (handler *Handler) agentVersions(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointGroups, err := handler.DataStore.EndpointGroup().EndpointGroups()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve environment groups from the database", err)
	}

	endpoints, err := handler.DataStore.Endpoint().Endpoints()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve environments from the database", err)
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	filteredEndpoints := security.FilterEndpoints(endpoints, endpointGroups, securityContext)

	agentVersions := set.Set[string]{}
	for _, endpoint := range filteredEndpoints {
		if endpoint.Agent.Version != "" {
			agentVersions[endpoint.Agent.Version] = true
		}
	}

	return response.JSON(w, agentVersions.Keys())
}
