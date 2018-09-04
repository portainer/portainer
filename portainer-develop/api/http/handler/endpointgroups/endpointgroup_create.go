package endpointgroups

import (
	"net/http"

	"github.com/asaskevich/govalidator"
	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/request"
	"github.com/portainer/portainer/http/response"
)

type endpointGroupCreatePayload struct {
	Name                string
	Description         string
	AssociatedEndpoints []portainer.EndpointID
	Tags                []string
}

func (payload *endpointGroupCreatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Name) {
		return portainer.Error("Invalid endpoint group name")
	}
	if payload.Tags == nil {
		payload.Tags = []string{}
	}
	return nil
}

// POST request on /api/endpoint_groups
func (handler *Handler) endpointGroupCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload endpointGroupCreatePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	endpointGroup := &portainer.EndpointGroup{
		Name:            payload.Name,
		Description:     payload.Description,
		AuthorizedUsers: []portainer.UserID{},
		AuthorizedTeams: []portainer.TeamID{},
		Tags:            payload.Tags,
	}

	err = handler.EndpointGroupService.CreateEndpointGroup(endpointGroup)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist the endpoint group inside the database", err}
	}

	endpoints, err := handler.EndpointService.Endpoints()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoints from the database", err}
	}

	for _, endpoint := range endpoints {
		if endpoint.GroupID == portainer.EndpointGroupID(1) {
			err = handler.checkForGroupAssignment(endpoint, endpointGroup.ID, payload.AssociatedEndpoints)
			if err != nil {
				return &httperror.HandlerError{http.StatusInternalServerError, "Unable to update endpoint", err}
			}
		}
	}

	return response.JSON(w, endpointGroup)
}
