package edgegroups

import (
	"net/http"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
)

// Handler is the HTTP handler used to handle endpoint group operations.
type Handler struct {
	*mux.Router
	EdgeGroupService portainer.EdgeGroupService
	EndpointService  portainer.EndpointService
	TagService       portainer.TagService
}

// NewHandler creates a handler to manage endpoint group operations.
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}
	h.Handle("/edge_groups",
		bouncer.AdminAccess(httperror.LoggerHandler(h.edgeGroupCreate))).Methods(http.MethodPost)
	h.Handle("/edge_groups",
		bouncer.AdminAccess(httperror.LoggerHandler(h.edgeGroupList))).Methods(http.MethodGet)
	h.Handle("/edge_groups/{id}",
		bouncer.AdminAccess(httperror.LoggerHandler(h.edgeGroupInspect))).Methods(http.MethodGet)
	h.Handle("/edge_groups/{id}",
		bouncer.AdminAccess(httperror.LoggerHandler(h.edgeGroupUpdate))).Methods(http.MethodPut)
	h.Handle("/edge_groups/{id}",
		bouncer.AdminAccess(httperror.LoggerHandler(h.edgeGroupDelete))).Methods(http.MethodDelete)
	return h
}

func (handler *Handler) getEndpointsByTags(tagIDs []portainer.TagID) ([]portainer.EndpointID, error) {
	endpointsSet := make(map[portainer.EndpointID]bool)
	endpointGroupsSet := make(map[portainer.EndpointGroupID]bool)
	for _, tagID := range tagIDs {
		tag, err := handler.TagService.Tag(tagID)
		if err != nil {
			return nil, err
		}

		for endpointID := range tag.Endpoints {
			endpointsSet[endpointID] = true
		}

		for endpointGroupID := range tag.EndpointGroups {
			endpointGroupsSet[endpointGroupID] = true
		}
	}

	endpoints, err := handler.EndpointService.Endpoints()
	if err != nil {
		return nil, err
	}

	results := []portainer.EndpointID{}
	for _, endpoint := range endpoints {
		if _, ok := endpointGroupsSet[endpoint.GroupID]; ok {
			endpointsSet[endpoint.ID] = true
		}
		if _, ok := endpointsSet[endpoint.ID]; ok && endpoint.Type == portainer.EdgeAgentEnvironment {
			results = append(results, endpoint.ID)
		}
	}

	return results, nil
}
