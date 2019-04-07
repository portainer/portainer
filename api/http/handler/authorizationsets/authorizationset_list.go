package authorizationsets

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
)

// GET request on /api/AuthorizationSet
func (handler *Handler) authorizationSetList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	authorizationSets, err := handler.AuthorizationSetService.AuthorizationSets()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve authorization sets from the database", err}
	}

	return response.JSON(w, authorizationSets)
}
