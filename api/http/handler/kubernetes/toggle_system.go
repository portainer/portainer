package kubernetes

import (
	"net/http"

	"github.com/portainer/portainer/api/http/middlewares"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

type namespacesToggleSystemPayload struct {
	// Toggle the system state of this namespace to true or false
	System bool `example:"true"`
}

func (payload *namespacesToggleSystemPayload) Validate(r *http.Request) error {
	return nil
}

// @id KubernetesNamespacesToggleSystem
// @summary Toggle the system state for a namespace
// @description Toggle the system state for a namespace
// @description **Access policy**: Administrator or environment administrator.
// @security ApiKeyAuth || jwt
// @tags kubernetes
// @accept json
// @param id path int true "Environment identifier"
// @param namespace path string true "Namespace name"
// @param body body namespacesToggleSystemPayload true "Update details"
// @success 204 "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier or unable to find the namespace to update."
// @failure 500 "Server error occurred while attempting to update the system state of the namespace."
// @router /kubernetes/{id}/namespaces/{namespace}/system [put]
func (handler *Handler) namespacesToggleSystem(rw http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpoint, err := middlewares.FetchEndpoint(r)
	if err != nil {
		return httperror.NotFound("Unable to find an environment on request context", err)
	}

	namespaceName, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		return httperror.BadRequest("Invalid namespace identifier route variable", err)
	}

	var payload namespacesToggleSystemPayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	kubeClient, err := handler.KubernetesClientFactory.GetPrivilegedKubeClient(endpoint)
	if err != nil {
		return httperror.InternalServerError("Unable to create kubernetes client", err)
	}

	err = kubeClient.ToggleSystemState(namespaceName, payload.System)
	if err != nil {
		return httperror.InternalServerError("Unable to toggle system status", err)
	}

	return response.Empty(rw)

}
