package registries

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

type registryUpdateAccessPayload struct {
	AuthorizedUsers []int
	AuthorizedTeams []int
}

func (payload *registryUpdateAccessPayload) Validate(r *http.Request) error {
	return nil
}

// TODO: remove this endpoint and use
// endpointUpdate operation directly from frontend?
type registryUpdateAccessPayload2 struct {
	UserAccessPolicies portainer.UserAccessPolicies
	TeamAccessPolicies portainer.TeamAccessPolicies
}

func (payload *registryUpdateAccessPayload2) Validate(r *http.Request) error {
	return nil
}

// PUT request on /api/registries/:id/access
func (handler *Handler) registryUpdateAccess(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	registryID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid registry identifier route variable", err}
	}

	var payload registryUpdateAccessPayload2
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	registry, err := handler.RegistryService.Registry(portainer.RegistryID(registryID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a registry with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a registry with the specified identifier inside the database", err}
	}

	registry.UserAccessPolicies = payload.UserAccessPolicies
	registry.TeamAccessPolicies = payload.TeamAccessPolicies
	// TODO: review
	//if payload.AuthorizedUsers != nil {
	//	userAccessPolicies := make(portainer.UserAccessPolicies)
	//	for _, value := range payload.AuthorizedUsers {
	//		userAccessPolicies[portainer.UserID(value)] = portainer.AccessPolicy{}
	//	}
	//	registry.UserAccessPolicies = userAccessPolicies
	//}
	//
	//if payload.AuthorizedTeams != nil {
	//	teamAccessPolicies := make(portainer.TeamAccessPolicies)
	//	for _, value := range payload.AuthorizedTeams {
	//		teamAccessPolicies[portainer.TeamID(value)] = portainer.AccessPolicy{}
	//	}
	//	registry.TeamAccessPolicies = teamAccessPolicies
	//}

	err = handler.RegistryService.UpdateRegistry(registry.ID, registry)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist registry changes inside the database", err}
	}

	return response.JSON(w, registry)
}
