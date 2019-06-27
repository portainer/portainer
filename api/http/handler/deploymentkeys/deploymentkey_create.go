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
	if err != nil && err != portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusInternalServerError, "An error occurred retrieving deploymentkey from the database", err}
	}
	if deploymentkey != nil {
		return &httperror.HandlerError{http.StatusConflict, "A deploymentkey for this resource already exists", portainer.ErrDeploymentkeyAlreadyExists}
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
