package kubernetes

import (
	"net/http"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/portainer/portainer/pkg/libkubectl"
	"github.com/rs/zerolog/log"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
)

type describeResourceResponse struct {
	Describe string `json:"describe"`
}

// @id DescribeResource
// @summary Get a description of a kubernetes resource
// @description Get a description of a kubernetes resource.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @param name query string true "Resource name"
// @param kind query string true "Resource kind"
// @param namespace query string false "Namespace"
// @success 200 {object} describeResourceResponse "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier."
// @failure 500 "Server error occurred while attempting to retrieve resource description"
// @router /kubernetes/{id}/describe [get]
func (handler *Handler) describeResource(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	name, err := request.RetrieveQueryParameter(r, "name", false)
	if err != nil {
		log.Error().Err(err).Str("context", "describeResource").Msg("Invalid query parameter name")
		return httperror.BadRequest("an error occurred during the describeResource operation, invalid query parameter name. Error: ", err)
	}

	kind, err := request.RetrieveQueryParameter(r, "kind", false)
	if err != nil {
		log.Error().Err(err).Str("context", "describeResource").Msg("Invalid query parameter kind")
		return httperror.BadRequest("an error occurred during the describeResource operation, invalid query parameter kind. Error: ", err)
	}

	namespace, err := request.RetrieveQueryParameter(r, "namespace", true)
	if err != nil {
		log.Error().Err(err).Str("context", "describeResource").Msg("Invalid query parameter namespace")
		return httperror.BadRequest("an error occurred during the describeResource operation, invalid query parameter namespace. Error: ", err)
	}

	// fetches the token and the correct server URL for the endpoint, similar to getHelmClusterAccess
	libKubectlAccess, err := handler.getLibKubectlAccess(r)
	if err != nil {
		return httperror.InternalServerError("an error occurred during the describeResource operation, failed to get libKubectlAccess. Error: ", err)
	}

	client, err := libkubectl.NewClient(libKubectlAccess, namespace, "", true)
	if err != nil {
		log.Error().Err(err).Str("context", "describeResource").Msg("Failed to create kubernetes client")
		return httperror.InternalServerError("an error occurred during the describeResource operation, failed to create kubernetes client. Error: ", err)
	}

	out, err := client.Describe(namespace, name, kind)
	if err != nil {
		if k8serrors.IsUnauthorized(err) || k8serrors.IsForbidden(err) {
			log.Error().Err(err).Str("context", "describeResource").Msg("Unauthorized access to the Kubernetes API")
			return httperror.Forbidden("an error occurred during the describeResource operation, unauthorized access to the Kubernetes API. Error: ", err)
		}

		log.Error().Err(err).Str("context", "describeResource").Msg("Failed to describe kubernetes resource")
		return httperror.InternalServerError("an error occurred during the describeResource operation, failed to describe kubernetes resource. Error: ", err)
	}

	return response.JSON(w, describeResourceResponse{Describe: out})
}
