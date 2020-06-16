package edgestacks

import (
	"github.com/portainer/portainer/api/bolt/errors"
	"net/http"
	"path"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

type stackFileResponse struct {
	StackFileContent string `json:"StackFileContent"`
}

// GET request on /api/edge_stacks/:id/file
func (handler *Handler) edgeStackFile(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	stackID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid edge stack identifier route variable", err}
	}

	stack, err := handler.DataStore.EdgeStack().EdgeStack(portainer.EdgeStackID(stackID))
	if err == errors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an edge stack with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an edge stack with the specified identifier inside the database", err}
	}

	stackFileContent, err := handler.FileService.GetFileContent(path.Join(stack.ProjectPath, stack.EntryPoint))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve Compose file from disk", err}
	}

	return response.JSON(w, &stackFileResponse{StackFileContent: string(stackFileContent)})
}
