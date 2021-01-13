package endpointgroups

import (
	"net/http"
	"reflect"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/errors"
	"github.com/portainer/portainer/api/internal/tag"
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

// @summary Update Endpoint group
// @description
// @tags EndpointGroups
// @security ApiKeyAuth
// @accept json
// @produce json
// @param id path int true "endpoint group id"
// @success 200 {object} portainer.EndpointGroup "Endpoint group"
// @failure 400,500
// @router /endpoint_groups/:id [put]
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

	endpointGroup, err := handler.DataStore.EndpointGroup().EndpointGroup(portainer.EndpointGroupID(endpointGroupID))
	if err == errors.ErrObjectNotFound {
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
		payloadTagSet := tag.Set(payload.TagIDs)
		endpointGroupTagSet := tag.Set((endpointGroup.TagIDs))
		union := tag.Union(payloadTagSet, endpointGroupTagSet)
		intersection := tag.Intersection(payloadTagSet, endpointGroupTagSet)
		tagsChanged = len(union) > len(intersection)

		if tagsChanged {
			removeTags := tag.Difference(endpointGroupTagSet, payloadTagSet)

			for tagID := range removeTags {
				tag, err := handler.DataStore.Tag().Tag(tagID)
				if err != nil {
					return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a tag inside the database", err}
				}
				delete(tag.EndpointGroups, endpointGroup.ID)
				err = handler.DataStore.Tag().UpdateTag(tag.ID, tag)
				if err != nil {
					return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist tag changes inside the database", err}
				}
			}

			endpointGroup.TagIDs = payload.TagIDs
			for _, tagID := range payload.TagIDs {
				tag, err := handler.DataStore.Tag().Tag(tagID)
				if err != nil {
					return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a tag inside the database", err}
				}

				tag.EndpointGroups[endpointGroup.ID] = true

				err = handler.DataStore.Tag().UpdateTag(tag.ID, tag)
				if err != nil {
					return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist tag changes inside the database", err}
				}
			}
		}
	}

	if payload.UserAccessPolicies != nil && !reflect.DeepEqual(payload.UserAccessPolicies, endpointGroup.UserAccessPolicies) {
		endpointGroup.UserAccessPolicies = payload.UserAccessPolicies
	}

	if payload.TeamAccessPolicies != nil && !reflect.DeepEqual(payload.TeamAccessPolicies, endpointGroup.TeamAccessPolicies) {
		endpointGroup.TeamAccessPolicies = payload.TeamAccessPolicies
	}

	err = handler.DataStore.EndpointGroup().UpdateEndpointGroup(endpointGroup.ID, endpointGroup)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist endpoint group changes inside the database", err}
	}

	if tagsChanged {
		endpoints, err := handler.DataStore.Endpoint().Endpoints()
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
