package deploymentkeys

import (
	"net/http"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

type deploymentKeyCreatePayload struct {
	Name string
}

func (payload *deploymentKeyCreatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Name) {
		return portainer.Error("Invalid deploymentkey name")
	}
	return nil
}

func (handler *Handler) deploymentkeyCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload deploymentKeyCreatePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	deploymentkey, err := handler.DeploymentKeyService.DeploymentKeyByName(payload.Name)
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a deployment key with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a deployment key with the specified identifier inside the database", err}
	}

	// Add a function to call and create public key and private key

	deploymentkey = &portainer.DeploymentKey{
		Name:       payload.Name,
		PublicKey:  "SHA256:hellotherepublic",
		PrivateKey: "SHA256:hellothereprivate",
	}

	err = handler.DeploymentKeyService.CreateDeploymentKey(deploymentkey)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist the deployment key inside the database", err}
	}

	return response.JSON(w, deploymentkey)
}
