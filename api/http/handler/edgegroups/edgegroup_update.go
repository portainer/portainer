package edgegroups

import (
	"net/http"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
)

type edgeGroupUpdatePayload struct {
	Name         string
	Dynamic      bool
	TagIDs       []portainer.TagID
	Endpoints    []portainer.EndpointID
	PartialMatch *bool
}

func (payload *edgeGroupUpdatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Name) {
		return portainer.Error("Invalid Edge group name")
	}
	if payload.Dynamic && (payload.TagIDs == nil || len(payload.TagIDs) == 0) {
		return portainer.Error("TagIDs is mandatory for a dynamic Edge group")
	}
	if !payload.Dynamic && (payload.Endpoints == nil || len(payload.Endpoints) == 0) {
		return portainer.Error("Endpoints is mandatory for a static Edge group")
	}
	return nil
}

func (handler *Handler) edgeGroupUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	edgeGroupID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid Edge group identifier route variable", err}
	}

	var payload edgeGroupUpdatePayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	edgeGroup, err := handler.EdgeGroupService.EdgeGroup(portainer.EdgeGroupID(edgeGroupID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an Edge group with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an Edge group with the specified identifier inside the database", err}
	}

	if payload.Name != "" {
		edgeGroups, err := handler.EdgeGroupService.EdgeGroups()
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve Edge groups from the database", err}
		}
		for _, edgeGroup := range edgeGroups {
			if edgeGroup.Name == payload.Name && edgeGroup.ID != portainer.EdgeGroupID(edgeGroupID) {
				return &httperror.HandlerError{http.StatusBadRequest, "Edge group name must be unique", portainer.Error("Edge group name must be unique")}
			}
		}

		edgeGroup.Name = payload.Name
	}
	endpoints, err := handler.EndpointService.Endpoints()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoints from database", err}
	}

	endpointGroups, err := handler.EndpointGroupService.EndpointGroups()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoint groups from database", err}
	}

	oldRelatedEndpoints := portainer.EdgeGroupRelatedEndpoints(edgeGroup, endpoints, endpointGroups)

	edgeGroup.Dynamic = payload.Dynamic
	if edgeGroup.Dynamic {
		edgeGroup.TagIDs = payload.TagIDs
	} else {
		endpointIDs := []portainer.EndpointID{}
		for _, endpointID := range payload.Endpoints {
			endpoint, err := handler.EndpointService.Endpoint(endpointID)
			if err != nil {
				return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve endpoint from the database", err}
			}

			if endpoint.Type == portainer.EdgeAgentEnvironment {
				endpointIDs = append(endpointIDs, endpoint.ID)
			}
		}
		edgeGroup.Endpoints = endpointIDs
	}

	if payload.PartialMatch != nil {
		edgeGroup.PartialMatch = *payload.PartialMatch
	}

	err = handler.EdgeGroupService.UpdateEdgeGroup(edgeGroup.ID, edgeGroup)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist Edge group changes inside the database", err}
	}

	newRelatedEndpoints := portainer.EdgeGroupRelatedEndpoints(edgeGroup, endpoints, endpointGroups)
	endpointsToUpdate := append(newRelatedEndpoints, oldRelatedEndpoints...)

	for _, endpointID := range endpointsToUpdate {
		err = handler.updateEndpoint(endpointID)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist Endpoint relation changes inside the database", err}
		}
	}

	return response.JSON(w, edgeGroup)
}

func (handler *Handler) updateEndpoint(endpointID portainer.EndpointID) error {
	relation, err := handler.EndpointRelationService.EndpointRelation(endpointID)
	if err != nil {
		return err
	}

	endpoint, err := handler.EndpointService.Endpoint(endpointID)
	if err != nil {
		return err
	}

	endpointGroup, err := handler.EndpointGroupService.EndpointGroup(endpoint.GroupID)
	if err != nil {
		return err
	}

	edgeGroups, err := handler.EdgeGroupService.EdgeGroups()
	if err != nil {
		return err
	}

	edgeStacks, err := handler.EdgeStackService.EdgeStacks()
	if err != nil {
		return err
	}

	edgeStackSet := map[portainer.EdgeStackID]bool{}

	endpointEdgeStacks := portainer.EndpointRelatedEdgeStacks(endpoint, endpointGroup, edgeGroups, edgeStacks)
	for _, edgeStackID := range endpointEdgeStacks {
		edgeStackSet[edgeStackID] = true
	}

	relation.EdgeStacks = edgeStackSet

	return handler.EndpointRelationService.UpdateEndpointRelation(endpoint.ID, relation)
}
