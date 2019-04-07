package authorizationsets

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

type authorizationSetUpdatePayload struct {
	Name string
}

func (payload *authorizationSetUpdatePayload) Validate(r *http.Request) error {
	return nil
}

// PUT request on /api/AuthorizationSet/:id
func (handler *Handler) authorizationSetUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	authorizationSetID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid authorization set identifier route variable", err}
	}

	var payload authorizationSetUpdatePayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	authorizationSet, err := handler.AuthorizationSetService.AuthorizationSet(portainer.AuthorizationSetID(authorizationSetID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a authorization set with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a authorization set with the specified identifier inside the database", err}
	}

	if payload.Name != "" {
		authorizationSet.Name = payload.Name
	}

	err = handler.AuthorizationSetService.UpdateAuthorizationSet(authorizationSet.ID, authorizationSet)
	if err != nil {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to persist authorization set changes inside the database", err}
	}

	return response.JSON(w, authorizationSet)
}
