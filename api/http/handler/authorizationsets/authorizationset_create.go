package authorizationsets

import (
	"net/http"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

type authorizationSetCreatePayload struct {
	Name string
}

func (payload *authorizationSetCreatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Name) {
		return portainer.Error("Invalid authorization set name")
	}
	return nil
}

func (handler *Handler) authorizationSetCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload authorizationSetCreatePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	authorizationSet := &portainer.AuthorizationSet{
		Name: payload.Name,
	}

	err = handler.AuthorizationSetService.CreateAuthorizationSet(authorizationSet)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist the authorization set inside the database", err}
	}

	return response.JSON(w, authorizationSet)
}
