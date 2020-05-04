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

	tagsChanged := false
	if payload.TagIDs != nil {
		payloadTagSet := portainer.TagSet(payload.TagIDs)
		endpointGroupTagSet := portainer.TagSet((endpointGroup.TagIDs))
		union := portainer.TagUnion(payloadTagSet, endpointGroupTagSet)
		intersection := portainer.TagIntersection(payloadTagSet, endpointGroupTagSet)
		tagsChanged = len(union) > len(intersection)

		if tagsChanged {
			removeTags := portainer.TagDifference(endpointGroupTagSet, payloadTagSet)

			for tagID := range removeTags {
				tag, err := handler.TagService.Tag(tagID)
				if err != nil {
					return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a tag inside the database", err}
				}
				delete(tag.EndpointGroups, endpointGroup.ID)
				err = handler.TagService.UpdateTag(tag.ID, tag)
				if err != nil {
					return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist tag changes inside the database", err}
				}
			}

			endpointGroup.TagIDs = payload.TagIDs
			for _, tagID := range payload.TagIDs {
				tag, err := handler.TagService.Tag(tagID)
				if err != nil {
					return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a tag inside the database", err}
				}

				tag.EndpointGroups[endpointGroup.ID] = true

				err = handler.TagService.UpdateTag(tag.ID, tag)
				if err != nil {
					return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist tag changes inside the database", err}
				}
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

	if tagsChanged {
		endpoints, err := handler.EndpointService.Endpoints()
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoints from the database", err}

		}

		for _, endpoint := range endpoints {
			if endpoint.GroupID == endpointGroup.ID {
				err = handler.updateEndpointRelations(&endpoint, endpointGroup)
				if err != nil {
					return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist endpoint relations changes inside the database", err}
				}
			}
		}
	}

	return response.JSON(w, endpointGroup)
}
