package kubernetes

import (
	"net/http"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/rs/zerolog/log"
	appsv1 "k8s.io/api/apps/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
)

// KubernetesReplicaSetListResponse is the documented response model for the replica
// set list endpoint. It mirrors the Kubernetes list shape ({items: [...]}).
type KubernetesReplicaSetListResponse appsv1.ReplicaSetList

// @id getKubernetesReplicaSets
// @summary Get Kubernetes replica sets within a namespace
// @description Get the list of Kubernetes replica sets in the given namespace, optionally
// @description restricted to those owned by a given deployment. This backs the deployment
// @description revisions view. The response uses the Kubernetes list shape ({items: [...]}).
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment(Endpoint) identifier"
// @param namespace path string true "Namespace"
// @param deployment query string false "Only return replica sets owned by this deployment"
// @param labelSelector query string false "Kubernetes label selector to filter the replica sets"
// @param fieldSelector query string false "Kubernetes field selector to filter the replica sets"
// @success 200 {object} KubernetesReplicaSetListResponse "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find the deployment given in the deployment query parameter."
// @failure 500 "Server error occurred while attempting to retrieve the replica sets within the specified namespace."
// @router /kubernetes/{id}/namespaces/{namespace}/replicasets [get]
func (handler *Handler) getKubernetesReplicaSets(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		log.Error().Err(err).Str("context", "getKubernetesReplicaSets").Msg("Unable to retrieve namespace identifier route variable")
		return httperror.BadRequest("Unable to retrieve namespace identifier route variable", err)
	}

	ownerDeployment, _ := request.RetrieveQueryParameter(r, "deployment", true)

	cli, httpErr := handler.prepareKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "getKubernetesReplicaSets").Str("namespace", namespace).Msg("Unable to get a Kubernetes client for the user")
		return httperror.InternalServerError("Unable to get a Kubernetes client for the user", httpErr)
	}

	replicaSets, err := cli.GetReplicaSets(namespace, ownerDeployment, parseK8sListOptions(r))
	if err != nil {
		if k8serrors.IsUnauthorized(err) || k8serrors.IsForbidden(err) {
			log.Error().Err(err).Str("context", "getKubernetesReplicaSets").Str("namespace", namespace).Msg("Unauthorized access to the Kubernetes API")
			return httperror.Forbidden("Unauthorized access to the Kubernetes API", err)
		}

		if k8serrors.IsNotFound(err) {
			log.Error().Err(err).Str("context", "getKubernetesReplicaSets").Str("namespace", namespace).Str("deployment", ownerDeployment).Msg("Unable to find the deployment that owns the replica sets")
			return httperror.NotFound("Unable to find the deployment that owns the replica sets", err)
		}

		log.Error().Err(err).Str("context", "getKubernetesReplicaSets").Str("namespace", namespace).Msg("Unable to retrieve replica sets")
		return httperror.InternalServerError("Unable to retrieve replica sets", err)
	}

	// Return the Kubernetes list shape ({items: [...]}) so it mirrors the raw API.
	return response.JSON(w, appsv1.ReplicaSetList{Items: replicaSets})
}
