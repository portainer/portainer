package stacks

import (
	"errors"
	"net/http"

	"github.com/asaskevich/govalidator"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
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
	permissionDeniedErr := "Permission denied to access endpoint"
	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusForbidden, permissionDeniedErr, err}
	}
	
	var payload kubernetesStackPayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	namespace := payload.Namespace
	if tokenData.Role != portainer.AdministratorRole {
		// check if the user has OperationK8sApplicationsAdvancedDeploymentRW access in the endpoint
		endpointRole, err := handler.AuthorizationService.GetUserEndpointRole(int(tokenData.ID), int(endpoint.ID))
		if err != nil {
			return &httperror.HandlerError{http.StatusForbidden, permissionDeniedErr, err}
		} else if !endpointRole.Authorizations[portainer.OperationK8sApplicationsAdvancedDeploymentRW] {
			err = errors.New(permissionDeniedErr)
			return &httperror.HandlerError{http.StatusForbidden, permissionDeniedErr, err}
		}
		// will skip if user can access all namespaces
		if !endpointRole.Authorizations[portainer.OperationK8sAccessAllNamespaces] {
			cli, err := handler.KubernetesClientFactory.GetKubeClient(endpoint)
			if err != nil {
				return &httperror.HandlerError{http.StatusInternalServerError, "Unable to create Kubernetes client", err}
			}
			// check if the user has RW access to the namespace
			namespaceAuthorizations, err := handler.AuthorizationService.GetNamespaceAuthorizations(int(tokenData.ID), *endpoint, cli)
			if err != nil {
				return &httperror.HandlerError{http.StatusForbidden, permissionDeniedErr, err}
			} else if auth, ok := namespaceAuthorizations[namespace]; !ok || !auth[portainer.OperationK8sAccessNamespaceWrite] {
				err = errors.New(permissionDeniedErr)
				return &httperror.HandlerError{http.StatusForbidden, permissionDeniedErr, err}
			}
		}
	}

	output, err := handler.deployKubernetesStack(endpoint, payload.StackFileContent, payload.ComposeFormat, namespace)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to deploy Kubernetes stack", err}
	}

	resp := &createKubernetesStackResponse{
		Output: string(output),
	}

	return response.JSON(w, resp)
}

func (handler *Handler) deployKubernetesStack(endpoint *portainer.Endpoint, data string, composeFormat bool, namespace string) ([]byte, error) {
	handler.stackCreationMutex.Lock()
	defer handler.stackCreationMutex.Unlock()

	return handler.KubernetesDeployer.Deploy(endpoint, data, composeFormat, namespace)
}
