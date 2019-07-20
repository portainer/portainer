package dockerhub

import (
	"net/http"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

type dockerhubUpdatePayload struct {
	Authentication bool
	Username       string
	Password       string
}

func (payload *dockerhubUpdatePayload) Validate(r *http.Request) error {
	if payload.Authentication && (govalidator.IsNull(payload.Username) || govalidator.IsNull(payload.Password)) {
		return portainer.Error("Invalid credentials. Username and password must be specified when authentication is enabled")
	}
	return nil
}

// PUT request on /api/dockerhub
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

	err = handler.DockerHubService.UpdateDockerHub(dockerhub)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist the Dockerhub changes inside the database", err}
	}

	return response.Empty(w)
}
