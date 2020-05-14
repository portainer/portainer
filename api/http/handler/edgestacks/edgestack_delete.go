package edgestacks

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

func (handler *Handler) edgeStackDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	edgeStackID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid edge stack identifier route variable", err}
	}

	edgeStack, err := handler.EdgeStackService.EdgeStack(portainer.EdgeStackID(edgeStackID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an edge stack with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an edge stack with the specified identifier inside the database", err}
	}

	err = handler.EdgeStackService.DeleteEdgeStack(portainer.EdgeStackID(edgeStackID))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove the edge stack from the database", err}
	}

	endpoints, err := handler.EndpointService.Endpoints()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoints from database", err}
	}

	endpointGroups, err := handler.EndpointGroupService.EndpointGroups()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoint groups from database", err}
	}

	edgeGroups, err := handler.EdgeGroupService.EdgeGroups()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve edge groups from database", err}
	}

	relatedEndpoints, err := portainer.EdgeStackRelatedEndpoints(edgeStack.EdgeGroups, endpoints, endpointGroups, edgeGroups)

	for _, endpointID := range relatedEndpoints {
		relation, err := handler.EndpointRelationService.EndpointRelation(endpointID)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find endpoint relation in database", err}
		}

		delete(relation.EdgeStacks, edgeStack.ID)

		err = handler.EndpointRelationService.UpdateEndpointRelation(endpointID, relation)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist endpoint relation in database", err}
		}
	}

	return response.Empty(w)
}
