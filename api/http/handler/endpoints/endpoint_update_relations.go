package endpoints

import (
	"net/http"

	"github.com/pkg/errors"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

type endpointUpdateRelationsPayload struct {
	Relations map[portainer.EndpointID]struct {
		EdgeGroups []portainer.EdgeGroupID
		Tags       []portainer.TagID
		Group      portainer.EndpointGroupID
	}
}

func (payload *endpointUpdateRelationsPayload) Validate(r *http.Request) error {
	for eID := range payload.Relations {
		if eID == 0 {
			return errors.New("Missing environment identifier")
		}
	}

	return nil
}

// @id EndpointUpdateRelations
// @summary Update relations for a list of environments
// @description Update relations for a list of environments
// @description Edge groups, tags and environment group can be updated.
// @description
// @description **Access policy**: administrator
// @tags endpoints
// @security jwt
// @accept json
// @param body body endpointUpdateRelationsPayload true "Environment relations data"
// @success 204 "Success"
// @failure 400 "Invalid request"
// @failure 401 "Unauthorized"
// @failure 404 "Not found"
// @failure 500 "Server error"
// @router /endpoints/relations [put]
func (handler *Handler) updateRelations(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {

	payload, err := request.GetPayload[endpointUpdateRelationsPayload](r)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	err = handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		for environmentID, relationPayload := range payload.Relations {
			endpoint, err := tx.Endpoint().Endpoint(environmentID)
			if err != nil {
				return errors.WithMessage(err, "Unable to find an environment with the specified identifier inside the database")
			}

			updateRelations := false

			if relationPayload.Group != 0 {
				groupIDChanged := endpoint.GroupID != relationPayload.Group
				endpoint.GroupID = relationPayload.Group
				updateRelations = updateRelations || groupIDChanged
			}

			if relationPayload.Tags != nil {
				tagsChanged, err := updateEnvironmentTags(tx, relationPayload.Tags, endpoint.TagIDs, endpoint.ID)
				if err != nil {
					return errors.WithMessage(err, "Unable to update environment tags")
				}

				endpoint.TagIDs = relationPayload.Tags
				updateRelations = updateRelations || tagsChanged
			}

			if relationPayload.EdgeGroups != nil {
				edgeGroupsChanged, err := updateEnvironmentEdgeGroups(tx, relationPayload.EdgeGroups, endpoint.ID)
				if err != nil {
					return errors.WithMessage(err, "Unable to update environment edge groups")
				}

				updateRelations = updateRelations || edgeGroupsChanged
			}

			if updateRelations {
				err := tx.Endpoint().UpdateEndpoint(endpoint.ID, endpoint)
				if err != nil {
					return errors.WithMessage(err, "Unable to update environment")
				}

				err = handler.updateEdgeRelations(tx, endpoint)
				if err != nil {
					return errors.WithMessage(err, "Unable to update environment relations")
				}
			}
		}

		return nil
	})

	if err != nil {
		return httperror.InternalServerError("Unable to update environment relations", err)
	}

	return response.Empty(w)
}
