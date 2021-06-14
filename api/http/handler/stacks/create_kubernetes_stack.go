package stacks

import (
	"errors"
	"net/http"

	"github.com/asaskevich/govalidator"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	endpointutils "github.com/portainer/portainer/api/internal/endpoint"
)

type kubernetesStackPayload struct {
	ComposeFormat    bool
	Namespace        string
	StackFileContent string
}

func (payload *kubernetesStackPayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.StackFileContent) {
		return errors.New("Invalid stack file content")
	}
	if govalidator.IsNull(payload.Namespace) {
		return errors.New("Invalid namespace")
	}
	return nil
}

type createKubernetesStackResponse struct {
	Output string `json:"Output"`
}

func (handler *Handler) createKubernetesStack(w http.ResponseWriter, r *http.Request, endpoint *portainer.Endpoint) *httperror.HandlerError {
	if !endpointutils.IsKubernetesEndpoint(endpoint) {
		return &httperror.HandlerError{http.StatusBadRequest, "Endpoint type does not match", errors.New("Endpoint type does not match")}
	}

	var payload kubernetesStackPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	output, err := handler.deployKubernetesStack(endpoint, payload.StackFileContent, payload.ComposeFormat, payload.Namespace)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to deploy Kubernetes stack", err}
	}

	resp := &createKubernetesStackResponse{
		Output: output,
	}

	return response.JSON(w, resp)
}

func (handler *Handler) deployKubernetesStack(endpoint *portainer.Endpoint, stackConfig string, composeFormat bool, namespace string) (string, error) {
	handler.stackCreationMutex.Lock()
	defer handler.stackCreationMutex.Unlock()

	if composeFormat {
		convertedConfig, err := handler.KubernetesDeployer.ConvertCompose(stackConfig)
		if err != nil {
			return "", err
		}
		stackConfig = string(convertedConfig)
	}

	return handler.KubernetesDeployer.Deploy(endpoint, stackConfig, namespace)

}
