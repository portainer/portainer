package endpointgroups

import (
	"errors"
	"net/http"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
)

type endpointGroupCreatePayload struct {
	Name                string
	Description         string
	AssociatedEndpoints []portainer.EndpointID
	TagIDs              []portainer.TagID
}

func (payload *endpointGroupCreatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Name) {
		return errors.New("Invalid endpoint group name")
	}
	if payload.TagIDs == nil {
		payload.TagIDs = []portainer.TagID{}
	}
	return nil
}

// @summary Creates an Endpoint Group
// @description
// @tags endpoint_groups
// @security jwt
// @accept json
// @produce json
// @param body body endpointGroupCreatePayload true "endpoint group data"
// @success 200 {object} portainer.EndpointGroup "Endpoint group"
// @failure 400,500
// @router /endpoint_groups [post]
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

	err = handler.DataStore.EndpointGroup().CreateEndpointGroup(endpointGroup)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist the endpoint group inside the database", err}
	}

	endpoints, err := handler.DataStore.Endpoint().Endpoints()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoints from the database", err}
	}

	for _, id := range payload.AssociatedEndpoints {
		for _, endpoint := range endpoints {
			if endpoint.ID == id {
				endpoint.GroupID = endpointGroup.ID

				err := handler.DataStore.Endpoint().UpdateEndpoint(endpoint.ID, &endpoint)
				if err != nil {
					return &httperror.HandlerError{http.StatusInternalServerError, "Unable to update endpoint", err}
				}

				err = handler.updateEndpointRelations(&endpoint, endpointGroup)
				if err != nil {
					return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist endpoint relations changes inside the database", err}
				}

				break
			}
		}
	}

	for _, tagID := range endpointGroup.TagIDs {
		tag, err := handler.DataStore.Tag().Tag(tagID)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve tag from the database", err}
		}

		tag.EndpointGroups[endpointGroup.ID] = true

		err = handler.DataStore.Tag().UpdateTag(tagID, tag)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist tag changes inside the database", err}
		}
	}

	return response.JSON(w, endpointGroup)
}
