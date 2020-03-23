package endpointgroups

import (
	"net/http"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

type endpointGroupCreatePayload struct {
	Name                string
	Description         string
	AssociatedEndpoints []portainer.EndpointID
	TagIDs              []portainer.TagID
}

func (payload *endpointGroupCreatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Name) {
		return portainer.Error("Invalid endpoint group name")
	}
	if payload.TagIDs == nil {
		payload.TagIDs = []portainer.TagID{}
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
		Name:               payload.Name,
		Description:        payload.Description,
		UserAccessPolicies: portainer.UserAccessPolicies{},
		TeamAccessPolicies: portainer.TeamAccessPolicies{},
		TagIDs:             payload.TagIDs,
	}

	err = handler.EndpointGroupService.CreateEndpointGroup(endpointGroup)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist the endpoint group inside the database", err}
	}

	endpoints, err := handler.EndpointService.Endpoints()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoints from the database", err}
	}

	for _, id := range payload.AssociatedEndpoints {
		for _, endpoint := range endpoints {
			if endpoint.ID == id {
				endpoint.GroupID = endpointGroup.ID

				err := handler.EndpointService.UpdateEndpoint(endpoint.ID, &endpoint)
				if err != nil {
					return &httperror.HandlerError{http.StatusInternalServerError, "Unable to update endpoint", err}
				}

				break
			}
		}
	}

	return response.JSON(w, endpointGroup)
}
