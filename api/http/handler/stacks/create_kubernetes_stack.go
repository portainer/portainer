package stacks

import (
	"net/http"

	"github.com/asaskevich/govalidator"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
)

type kubernetesStackPayload struct {
	StackFileContent string
}

func (payload *kubernetesStackPayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.StackFileContent) {
		return portainer.Error("Invalid stack file content")
	}
	return nil
}

type createKubernetesStackResponse struct {
	Output string `json:"Output"`
}

func (handler *Handler) createKubernetesStack(w http.ResponseWriter, r *http.Request, endpoint *portainer.Endpoint) *httperror.HandlerError {
	var payload kubernetesStackPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	output, err := handler.deployKubernetesStack(endpoint, payload.StackFileContent)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, err.Error(), err}
	}

	resp := &createKubernetesStackResponse{
		Output: string(output),
	}

	return response.JSON(w, resp)
}

func (handler *Handler) deployKubernetesStack(endpoint *portainer.Endpoint, data string) ([]byte, error) {
	handler.stackCreationMutex.Lock()
	defer handler.stackCreationMutex.Unlock()

	return handler.KubernetesDeployer.Deploy(endpoint, data)
}
