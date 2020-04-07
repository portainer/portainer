package edgestacks

import (
	"net/http"
	"strconv"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

type updateEdgeStackPayload struct {
	StackFileContent string
	Prune            *bool
	EdgeGroups       []portainer.EdgeGroupID
}

func (payload *updateEdgeStackPayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.StackFileContent) {
		return portainer.Error("Invalid stack file content")
	}
	if payload.EdgeGroups != nil && len(payload.EdgeGroups) == 0 {
		return portainer.Error("Edge Groups are mandatory for an Edge stack")
	}
	return nil
}

// PUT request on /api/stacks/:id?endpointId=<endpointId>
func (handler *Handler) edgeStackUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	stackID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid stack identifier route variable", err}
	}

	stack, err := handler.EdgeStackService.EdgeStack(portainer.EdgeStackID(stackID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a stack with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a stack with the specified identifier inside the database", err}
	}

	var payload updateEdgeStackPayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	if payload.EdgeGroups != nil {
		stack.EdgeGroups = payload.EdgeGroups
	}

	if payload.Prune != nil {
		stack.Prune = *payload.Prune
	}

	stackFolder := strconv.Itoa(int(stack.ID))
	_, err = handler.FileService.StoreStackFileFromBytes(stackFolder, stack.EntryPoint, []byte(payload.StackFileContent))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist updated Compose file on disk", err}
	}

	err = handler.EdgeStackService.UpdateEdgeStack(stack.ID, stack)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist the stack changes inside the database", err}
	}

	return response.JSON(w, stack)
}
