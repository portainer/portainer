package deploykeys

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer"
)

// DELETE request on /api/deploykeys/:id
func (handler *Handler) deploykeyDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	id, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid deploykey identifier route variable", err}
	}

	err = handler.DeploykeyService.DeleteDeploykey(portainer.DeploykeyID(id))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove the deploykey from the database", err}
	}

	return response.Empty(w)
}
