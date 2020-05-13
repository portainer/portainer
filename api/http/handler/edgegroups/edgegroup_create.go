package edgegroups

import (
	"net/http"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

type edgeGroupCreatePayload struct {
	Name         string
	Dynamic      bool
	TagIDs       []portainer.TagID
	Endpoints    []portainer.EndpointID
	PartialMatch bool
}

func (payload *edgeGroupCreatePayload) Validate(r *http.Request) error {
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

func (handler *Handler) edgeGroupCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload edgeGroupCreatePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	edgeGroups, err := handler.EdgeGroupService.EdgeGroups()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve Edge groups from the database", err}
	}

	for _, edgeGroup := range edgeGroups {
		if edgeGroup.Name == payload.Name {
			return &httperror.HandlerError{http.StatusBadRequest, "Edge group name must be unique", portainer.Error("Edge group name must be unique")}
		}
	}

	edgeGroup := &portainer.EdgeGroup{
		Name:         payload.Name,
		Dynamic:      payload.Dynamic,
		TagIDs:       []portainer.TagID{},
		Endpoints:    []portainer.EndpointID{},
		PartialMatch: payload.PartialMatch,
	}

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

	err = handler.EdgeGroupService.CreateEdgeGroup(edgeGroup)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist the Edge group inside the database", err}
	}

	return response.JSON(w, edgeGroup)
}
