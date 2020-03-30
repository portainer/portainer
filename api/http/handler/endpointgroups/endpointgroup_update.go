package endpointgroups

import (
	"net/http"
	"reflect"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

type endpointGroupUpdatePayload struct {
	Name               string
	Description        string
	TagIDs             []portainer.TagID
	UserAccessPolicies portainer.UserAccessPolicies
	TeamAccessPolicies portainer.TeamAccessPolicies
}

func (payload *endpointGroupUpdatePayload) Validate(r *http.Request) error {
	return nil
}

// PUT request on /api/endpoint_groups/:id
func (handler *Handler) endpointGroupUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointGroupID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid endpoint group identifier route variable", err}
	}

	var payload endpointGroupUpdatePayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	endpointGroup, err := handler.EndpointGroupService.EndpointGroup(portainer.EndpointGroupID(endpointGroupID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an endpoint group with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an endpoint group with the specified identifier inside the database", err}
	}

	if payload.Name != "" {
		endpointGroup.Name = payload.Name
	}

	if payload.Description != "" {
		endpointGroup.Description = payload.Description
	}

	if payload.TagIDs != nil {
		// tagsMap[tagID] is true if needs to add, and false if needs to remove
		tagsMap := make(map[portainer.TagID]bool)
		for _, tagID := range payload.TagIDs {
			tagsMap[tagID] = true
		}
		for _, tagID := range endpointGroup.TagIDs {
			_, alreadyExist := tagsMap[tagID]
			if alreadyExist {
				delete(tagsMap, tagID)
			} else {
				tagsMap[tagID] = false
			}
		}
		endpointGroup.TagIDs = payload.TagIDs
		for tagID, value := range tagsMap {
			tag, err := handler.TagService.Tag(tagID)
			if err != nil {
				return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a tag inside the database", err}
			}

			if value {
				tag.EndpointGroups[endpointGroup.ID] = true
			} else {
				delete(tag.EndpointGroups, endpointGroup.ID)
			}

			err = handler.TagService.UpdateTag(tagID, tag)
			if err != nil {
				return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist tag association changes inside the database", err}
			}
		}
	}

	updateAuthorizations := false
	if payload.UserAccessPolicies != nil && !reflect.DeepEqual(payload.UserAccessPolicies, endpointGroup.UserAccessPolicies) {
		endpointGroup.UserAccessPolicies = payload.UserAccessPolicies
		updateAuthorizations = true
	}

	if payload.TeamAccessPolicies != nil && !reflect.DeepEqual(payload.TeamAccessPolicies, endpointGroup.TeamAccessPolicies) {
		endpointGroup.TeamAccessPolicies = payload.TeamAccessPolicies
		updateAuthorizations = true
	}

	err = handler.EndpointGroupService.UpdateEndpointGroup(endpointGroup.ID, endpointGroup)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist endpoint group changes inside the database", err}
	}

	if updateAuthorizations {
		err = handler.AuthorizationService.UpdateUsersAuthorizations()
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to update user authorizations", err}
		}
	}

	return response.JSON(w, endpointGroup)
}
