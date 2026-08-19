package kubernetes

import (
	"bytes"
	"io"
	"net/http"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
)

// @id UpdateKubernetesNamespaceDeprecated
// @summary Update a namespace
// @description Update a namespace within the given environment.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @produce json
// @param id path int true "Environment identifier"
// @param namespace path string true "Namespace"
// @param body body models.K8sNamespaceDetails true "Namespace details"
// @success 200 {object} portainer.K8sNamespaceInfo "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier or unable to find a specific namespace."
// @failure 500 "Server error occurred while attempting to update the namespace."
// @router /kubernetes/{id}/namespaces [put]
func deprecatedNamespaceParser(w http.ResponseWriter, r *http.Request) (string, *httperror.HandlerError) {
	environmentId, err := request.RetrieveRouteVariableValue(r, "id")
	if err != nil {
		return "", httperror.BadRequest("Invalid query parameter: id", err)
	}

	// Restore the original body for further use
	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		return "", httperror.InternalServerError("Unable to read request body", err)
	}

	r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	payload := models.K8sNamespaceDetails{}
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		return "", httperror.BadRequest("Invalid request. Unable to parse namespace payload", err)
	}
	namespaceName := payload.Name

	r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	return "/kubernetes/" + environmentId + "/namespaces/" + namespaceName, nil
}
