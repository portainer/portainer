package edgestacks

import (
	"net/http"
	"time"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

type edgeStackCreatePayload struct {
	Name       string
	EdgeGroups []portainer.EdgeGroupID
}

func (payload *edgeStackCreatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Name) {
		return portainer.Error("Invalid Edge stack name")
	}
	if payload.EdgeGroups == nil || len(payload.EdgeGroups) == 0 {
		return portainer.Error("EdgeGroups is mandatory for an Edge stack")
	}
	return nil
}

// POST request on /api/endpoint_groups
func (handler *Handler) edgeStackCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload edgeStackCreatePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	edgeStacks, err := handler.EdgeStackService.EdgeStacks()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve Edge stacks from the database", err}
	}

	for _, edgeStack := range edgeStacks {
		if edgeStack.Name == payload.Name {
			return &httperror.HandlerError{http.StatusBadRequest, "Edge stack name must be unique", portainer.Error("Edge stack name must be unique")}
		}
	}

	edgeStack := &portainer.EdgeStack{
		Name:         payload.Name,
		EdgeGroups:   payload.EdgeGroups,
		CreationDate: time.Now().Unix(),
		Status:       make(map[portainer.EndpointID]portainer.EdgeStackStatus),
	}

	err = handler.EdgeStackService.CreateEdgeStack(edgeStack)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist the edge stack inside the database", err}
	}

	return response.JSON(w, edgeStack)
}
