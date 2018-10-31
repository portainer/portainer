package deploykeys

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
)

// GET request on /api/deploykeys
func (handler *Handler) deploykeyList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	deploykeys, err := handler.DeploykeyService.Deploykeys()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve deploykeys from the database", err}
	}

	return response.JSON(w, deploykeys)
}
