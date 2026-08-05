package kubernetes

import (
	"net/http"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/rs/zerolog/log"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
)

// @id DeleteKubernetesPod
// @summary Delete a kubernetes pod
// @description Delete a single Kubernetes pod in the given namespace. The owning
// @description controller (Deployment, StatefulSet, DaemonSet, ...) is responsible
// @description for recreating the pod. For naked pods the pod is removed permanently.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment(Endpoint) identifier"
// @param namespace path string true "Namespace"
// @param name path string true "Pod name"
// @success 204 "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier or unable to find the specified pod."
// @failure 500 "Server error occurred while attempting to delete the pod."
// @router /kubernetes/{id}/namespaces/{namespace}/pods/{name} [delete]
func (handler *Handler) deleteKubernetesPod(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, name, httpErr := parseNamespaceAndPodName(r)
	if httpErr != nil {
		return httpErr
	}

	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "DeleteKubernetesPod").Str("namespace", namespace).Str("name", name).Msg("Unable to get a Kubernetes client for the user")
		return httperror.InternalServerError("Unable to get a Kubernetes client for the user", httpErr)
	}

	if err := cli.DeletePod(namespace, name); err != nil {
		if k8serrors.IsNotFound(err) {
			log.Error().Err(err).Str("context", "DeleteKubernetesPod").Str("namespace", namespace).Str("name", name).Msg("Pod not found")
			return httperror.NotFound("Pod not found", err)
		}
		if k8serrors.IsForbidden(err) {
			log.Error().Err(err).Str("context", "DeleteKubernetesPod").Str("namespace", namespace).Str("name", name).Msg("Permission denied to delete the pod")
			return httperror.Forbidden("Permission denied to delete the pod", err)
		}
		log.Error().Err(err).Str("context", "DeleteKubernetesPod").Str("namespace", namespace).Str("name", name).Msg("Unable to delete the pod")
		return httperror.InternalServerError("Unable to delete the pod", err)
	}

	return response.Empty(w)
}

// @id RestartKubernetesPod
// @summary Restart all containers in a Kubernetes pod
// @description Restart all containers in a single Kubernetes pod in place using
// @description the Kubernetes 1.35 alpha pod-restart subresource. The pod itself
// @description is preserved. Requires the cluster to expose the corresponding
// @description subresource (and the matching feature gate to be enabled).
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment(Endpoint) identifier"
// @param namespace path string true "Namespace"
// @param name path string true "Pod name"
// @success 204 "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment, the specified pod, or the cluster does not expose the pod-restart subresource (Kubernetes <1.35 or feature gate disabled)."
// @failure 405 "The cluster does not support the pod-restart subresource (Kubernetes <1.35 or feature gate disabled)."
// @failure 500 "Server error occurred while attempting to restart the pod."
// @router /kubernetes/{id}/namespaces/{namespace}/pods/{name}/restart [post]
func (handler *Handler) restartKubernetesPod(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, name, httpErr := parseNamespaceAndPodName(r)
	if httpErr != nil {
		return httpErr
	}

	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "RestartKubernetesPod").Str("namespace", namespace).Str("name", name).Msg("Unable to get a Kubernetes client for the user")
		return httperror.InternalServerError("Unable to get a Kubernetes client for the user", httpErr)
	}

	if err := cli.RestartPod(namespace, name); err != nil {
		if k8serrors.IsNotFound(err) {
			log.Error().Err(err).Str("context", "RestartKubernetesPod").Str("namespace", namespace).Str("name", name).Msg("Pod or pod-restart subresource not found")
			return httperror.NotFound("Pod or pod-restart subresource not found. The Kubernetes 1.35 alpha pod-restart subresource is required and may need its feature gate enabled.", err)
		}
		if k8serrors.IsMethodNotSupported(err) {
			log.Error().Err(err).Str("context", "RestartKubernetesPod").Str("namespace", namespace).Str("name", name).Msg("Pod-restart subresource not supported")
			return httperror.NewError(http.StatusMethodNotAllowed, "The cluster does not support the pod-restart subresource (Kubernetes <1.35 or feature gate disabled).", err)
		}
		if k8serrors.IsForbidden(err) {
			log.Error().Err(err).Str("context", "RestartKubernetesPod").Str("namespace", namespace).Str("name", name).Msg("Permission denied to restart the pod")
			return httperror.Forbidden("Permission denied to restart the pod", err)
		}
		log.Error().Err(err).Str("context", "RestartKubernetesPod").Str("namespace", namespace).Str("name", name).Msg("Unable to restart the pod")
		return httperror.InternalServerError("Unable to restart the pod", err)
	}

	return response.Empty(w)
}

func parseNamespaceAndPodName(r *http.Request) (string, string, *httperror.HandlerError) {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		log.Error().Err(err).Str("context", "parseNamespaceAndPodName").Msg("Invalid namespace route variable")
		return "", "", httperror.BadRequest("Invalid namespace route variable", err)
	}

	name, err := request.RetrieveRouteVariableValue(r, "name")
	if err != nil {
		log.Error().Err(err).Str("context", "parseNamespaceAndPodName").Msg("Invalid pod name route variable")
		return "", "", httperror.BadRequest("Invalid pod name route variable", err)
	}

	return namespace, name, nil
}
