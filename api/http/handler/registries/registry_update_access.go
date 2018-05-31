package registries

import (
	"net/http"

	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/request"
	"github.com/portainer/portainer/http/response"
)

type registryUpdateAccessPayload struct {
	AuthorizedUsers []int
	AuthorizedTeams []int
}

func (payload *registryUpdateAccessPayload) Validate(r *http.Request) error {
	return nil
}

// PUT request on /api/registries/:id/access
func (handler *Handler) registryUpdateAccess(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	registryID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid registry identifier route variable", err}
	}

	var payload registryUpdateAccessPayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	registry, err := handler.RegistryService.Registry(portainer.RegistryID(registryID))
	if err == portainer.ErrEndpointGroupNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a registry with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a registry with the specified identifier inside the database", err}
	}

	if payload.AuthorizedUsers != nil {
		authorizedUserIDs := []portainer.UserID{}
		for _, value := range payload.AuthorizedUsers {
			authorizedUserIDs = append(authorizedUserIDs, portainer.UserID(value))
		}
		registry.AuthorizedUsers = authorizedUserIDs
	}

	if payload.AuthorizedTeams != nil {
		authorizedTeamIDs := []portainer.TeamID{}
		for _, value := range payload.AuthorizedTeams {
			authorizedTeamIDs = append(authorizedTeamIDs, portainer.TeamID(value))
		}
		registry.AuthorizedTeams = authorizedTeamIDs
	}

	err = handler.RegistryService.UpdateRegistry(registry.ID, registry)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist registry changes inside the database", err}
	}

	hideFields(registry)
	return response.JSON(w, registry)
}
