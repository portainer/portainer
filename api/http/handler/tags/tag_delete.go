package tags

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/internal/edge"
)

// @id TagDelete
// @summary Remove a tag
// @description Remove a tag.
// @description **Access policy**: administrator
// @tags tags
// @security ApiKeyAuth
// @security jwt
// @param id path int true "Tag identifier"
// @success 204 "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied"
// @failure 404 "Tag not found"
// @failure 500 "Server error"
// @router /tags/{id} [delete]
func (handler *Handler) tagDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	id, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid tag identifier route variable", err)
	}
	tagID := portainer.TagID(id)

	tag, err := handler.DataStore.Tag().Tag(tagID)
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find a tag with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find a tag with the specified identifier inside the database", err)
	}

	for endpointID := range tag.Endpoints {
		endpoint, err := handler.DataStore.Endpoint().Endpoint(endpointID)
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve environment from the database", err)
		}

		endpoint.TagIDs = removeElement(endpoint.TagIDs, tagID)
		err = handler.DataStore.Endpoint().UpdateEndpoint(endpoint.ID, endpoint)
		if err != nil {
			return httperror.InternalServerError("Unable to update environment", err)
		}
	}

	for endpointGroupID := range tag.EndpointGroups {
		endpointGroup, err := handler.DataStore.EndpointGroup().EndpointGroup(endpointGroupID)
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve environment group from the database", err)
		}

		endpointGroup.TagIDs = removeElement(endpointGroup.TagIDs, tagID)
		err = handler.DataStore.EndpointGroup().UpdateEndpointGroup(endpointGroup.ID, endpointGroup)
		if err != nil {
			return httperror.InternalServerError("Unable to update environment group", err)
		}
	}

	endpoints, err := handler.DataStore.Endpoint().Endpoints()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve environments from the database", err)
	}

	edgeGroups, err := handler.DataStore.EdgeGroup().EdgeGroups()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve edge groups from the database", err)
	}

	edgeStacks, err := handler.DataStore.EdgeStack().EdgeStacks()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve edge stacks from the database", err)
	}

	for _, endpoint := range endpoints {
		if (tag.Endpoints[endpoint.ID] || tag.EndpointGroups[endpoint.GroupID]) && (endpoint.Type == portainer.EdgeAgentOnDockerEnvironment || endpoint.Type == portainer.EdgeAgentOnKubernetesEnvironment) {
			err = handler.updateEndpointRelations(endpoint, edgeGroups, edgeStacks)
			if err != nil {
				return httperror.InternalServerError("Unable to update environment relations in the database", err)
			}
		}
	}

	for _, edgeGroup := range edgeGroups {
		err = handler.DataStore.EdgeGroup().UpdateEdgeGroupFunc(edgeGroup.ID, func(g *portainer.EdgeGroup) {
			g.TagIDs = removeElement(g.TagIDs, tagID)
		})
		if err != nil {
			return httperror.InternalServerError("Unable to update edge group", err)
		}
	}

	err = handler.DataStore.Tag().DeleteTag(tagID)
	if err != nil {
		return httperror.InternalServerError("Unable to remove the tag from the database", err)
	}

	return response.Empty(w)
}

func (handler *Handler) updateEndpointRelations(endpoint portainer.Endpoint, edgeGroups []portainer.EdgeGroup, edgeStacks []portainer.EdgeStack) error {
	endpointGroup, err := handler.DataStore.EndpointGroup().EndpointGroup(endpoint.GroupID)
	if err != nil {
		return err
	}

	endpointStacks := edge.EndpointRelatedEdgeStacks(&endpoint, endpointGroup, edgeGroups, edgeStacks)
	stacksSet := map[portainer.EdgeStackID]bool{}
	for _, edgeStackID := range endpointStacks {
		stacksSet[edgeStackID] = true
	}

	return handler.DataStore.EndpointRelation().UpdateEndpointRelationFunc(endpoint.ID, func(relation *portainer.EndpointRelation) {
		relation.EdgeStacks = stacksSet
	})
}

func removeElement(slice []portainer.TagID, elem portainer.TagID) []portainer.TagID {
	for i, id := range slice {
		if id == elem {
			slice[i] = slice[len(slice)-1]

			return slice[:len(slice)-1]
		}
	}

	return slice
}
