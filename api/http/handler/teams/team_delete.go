package teams

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/errors"
)

// DELETE request on /api/teams/:id
func (handler *Handler) teamDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	teamID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid team identifier route variable", err}
	}

	_, err = handler.DataStore.Team().Team(portainer.TeamID(teamID))
	if err == errors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a team with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a team with the specified identifier inside the database", err}
	}

	err = handler.DataStore.Team().DeleteTeam(portainer.TeamID(teamID))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to delete the team from the database", err}
	}

	err = handler.DataStore.TeamMembership().DeleteTeamMembershipByTeamID(portainer.TeamID(teamID))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to delete associated team memberships from the database", err}
	}

	err = handler.AuthorizationService.RemoveTeamAccessPolicies(portainer.TeamID(teamID))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to clean-up team access policies", err}
	}

	endpoints, err := handler.DataStore.Endpoint().Endpoints()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to get user endpoint access", err}
	}

	for _, endpoint := range endpoints {
		if endpoint.Type != portainer.KubernetesLocalEnvironment &&
			endpoint.Type != portainer.AgentOnKubernetesEnvironment &&
			endpoint.Type != portainer.EdgeAgentOnKubernetesEnvironment {
			continue
		}

		kcl, err := handler.K8sClientFactory.GetKubeClient(&endpoint)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to get k8s endpoint access", err}
		}

		accessPolicies, err := kcl.GetNamespaceAccessPolicies()
		if err != nil {
			break
		}

		accessPolicies, hasChange, err := handler.AuthorizationService.RemoveTeamNamespaceAccessPolicies(
			teamID, int(endpoint.ID), accessPolicies,
		)
		if hasChange {
			err = kcl.UpdateNamespaceAccessPolicies(accessPolicies)
			if err != nil {
				break
			}
		}
	}

	return response.Empty(w)
}
