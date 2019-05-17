package endpoints

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

type endpointUpdateAccessPayload struct {
	AuthorizedUsers []int
	AuthorizedTeams []int
	RoleID          int
}

func (payload *endpointUpdateAccessPayload) Validate(r *http.Request) error {
	return nil
}

// PUT request on /api/endpoints/:id/access
func (handler *Handler) endpointUpdateAccess(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	if !handler.authorizeEndpointManagement {
		return &httperror.HandlerError{http.StatusServiceUnavailable, "Endpoint management is disabled", ErrEndpointManagementDisabled}
	}

	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid endpoint identifier route variable", err}
	}

	var payload endpointUpdateAccessPayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	endpoint, err := handler.EndpointService.Endpoint(portainer.EndpointID(endpointID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an endpoint with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an endpoint with the specified identifier inside the database", err}
	}

	// TODO: support for roles to add
	if payload.AuthorizedUsers != nil {
		userAccessPolicies := make(portainer.UserAccessPolicies)
		for _, value := range payload.AuthorizedUsers {
			policy := portainer.AccessPolicy{}
			if payload.RoleID != 0 {
				policy.RoleID = portainer.RoleID(payload.RoleID)
			}
			userAccessPolicies[portainer.UserID(value)] = policy
		}
		endpoint.UserAccessPolicies = userAccessPolicies
	}

	if payload.AuthorizedTeams != nil {
		teamAccessPolicies := make(portainer.TeamAccessPolicies)
		for _, value := range payload.AuthorizedTeams {
			policy := portainer.AccessPolicy{}
			if payload.RoleID != 0 {
				policy.RoleID = portainer.RoleID(payload.RoleID)
			}
			teamAccessPolicies[portainer.TeamID(value)] = policy
		}
		endpoint.TeamAccessPolicies = teamAccessPolicies
	}

	err = handler.EndpointService.UpdateEndpoint(endpoint.ID, endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist endpoint changes inside the database", err}
	}

	return response.JSON(w, endpoint)
}
