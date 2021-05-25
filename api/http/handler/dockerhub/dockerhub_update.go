package dockerhub

import (
	"errors"
	"net/http"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
)

type dockerhubUpdatePayload struct {
	// Enable authentication against DockerHub
	Authentication bool `validate:"required" example:"false"`
	// Username used to authenticate against the DockerHub
	Username string `validate:"required" example:"hub_user"`
	// Password used to authenticate against the DockerHub
	Password string `validate:"required" example:"hub_password"`
}

func (payload *dockerhubUpdatePayload) Validate(r *http.Request) error {
	if payload.Authentication && (govalidator.IsNull(payload.Username) || govalidator.IsNull(payload.Password)) {
		return errors.New("Invalid credentials. Username and password must be specified when authentication is enabled")
	}
	return nil
}

// @id DockerHubUpdate
// @summary Update DockerHub information
// @description Use this endpoint to update the information used to connect to the DockerHub
// @description **Access policy**: administrator
// @tags dockerhub
// @security jwt
// @accept json
// @produce json
// @param body body dockerhubUpdatePayload true "DockerHub information"
// @success 204 "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /dockerhub [put]
func (handler *Handler) dockerhubUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload dockerhubUpdatePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	dockerhub := &portainer.DockerHub{
		Authentication: false,
		Username:       "",
		Password:       "",
	}

	if payload.Authentication {
		dockerhub.Authentication = true
		dockerhub.Username = payload.Username
		dockerhub.Password = payload.Password
	}

	err = handler.DataStore.DockerHub().UpdateDockerHub(dockerhub)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist the Dockerhub changes inside the database", err}
	}

	return response.Empty(w)
}
