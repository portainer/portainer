package edgestacks

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
)

func (handler *Handler) edgeStackList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	edgeStacks, err := handler.EdgeStackService.EdgeStacks()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve edge stacks from the database", err}
	}

	return response.JSON(w, edgeStacks)
}
