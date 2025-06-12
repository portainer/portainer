package kubernetes

import (
	"net/http"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/rs/zerolog/log"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
)

// @id getKubernetesEventsForNamespace
// @summary Gets kubernetes events for namespace
// @description Get events by optional query param resourceId for a given namespace.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @param namespace path string true "The namespace name the events are associated to"
// @param resourceId query string false "The resource id of the involved kubernetes object" example:"e5b021b6-4bce-4c06-bd3b-6cca906797aa"
// @success 200 {object} []kubernetes.K8sEvent "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 500 "Server error occurred while attempting to retrieve the events within the specified namespace."
// @router /kubernetes/{id}/namespaces/{namespace}/events [get]
func (handler *Handler) getKubernetesEventsForNamespace(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		log.Error().Err(err).Str("context", "getKubernetesEvents").Str("namespace", namespace).Msg("Unable to retrieve namespace identifier route variable")
		return httperror.BadRequest("Unable to retrieve namespace identifier route variable", err)
	}

	resourceId, err := request.RetrieveQueryParameter(r, "resourceId", true)
	if err != nil {
		log.Error().Err(err).Str("context", "getKubernetesEvents").Msg("Unable to retrieve resourceId query parameter")
		return httperror.BadRequest("Unable to retrieve resourceId query parameter", err)
	}

	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "getKubernetesEvents").Str("resourceId", resourceId).Msg("Unable to get a Kubernetes client for the user")
		return httperror.InternalServerError("Unable to get a Kubernetes client for the user", httpErr)
	}

	events, err := cli.GetEvents(namespace, resourceId)
	if err != nil {
		if k8serrors.IsUnauthorized(err) || k8serrors.IsForbidden(err) {
			log.Error().Err(err).Str("context", "getKubernetesEvents").Msg("Unauthorized access to the Kubernetes API")
			return httperror.Forbidden("Unauthorized access to the Kubernetes API", err)
		}

		log.Error().Err(err).Str("context", "getKubernetesEvents").Msg("Unable to retrieve events")
		return httperror.InternalServerError("Unable to retrieve events", err)
	}

	return response.JSON(w, events)
}

// @id getAllKubernetesEvents
// @summary Gets kubernetes events
// @description Get events by query param resourceId
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @param resourceId query string false "The resource id of the involved kubernetes object"  example:"e5b021b6-4bce-4c06-bd3b-6cca906797aa"
// @success 200 {object} []kubernetes.K8sEvent "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 500 "Server error occurred while attempting to retrieve the events."
// @router /kubernetes/{id}/events [get]
func (handler *Handler) getAllKubernetesEvents(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	resourceId, err := request.RetrieveQueryParameter(r, "resourceId", true)
	if err != nil {
		log.Error().Err(err).Str("context", "getKubernetesEvents").Msg("Unable to retrieve resourceId query parameter")
		return httperror.BadRequest("Unable to retrieve resourceId query parameter", err)
	}

	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "getKubernetesEvents").Str("resourceId", resourceId).Msg("Unable to get a Kubernetes client for the user")
		return httperror.InternalServerError("Unable to get a Kubernetes client for the user", httpErr)
	}

	events, err := cli.GetEvents("", resourceId)
	if err != nil {
		if k8serrors.IsUnauthorized(err) || k8serrors.IsForbidden(err) {
			log.Error().Err(err).Str("context", "getKubernetesEvents").Msg("Unauthorized access to the Kubernetes API")
			return httperror.Forbidden("Unauthorized access to the Kubernetes API", err)
		}

		log.Error().Err(err).Str("context", "getKubernetesEvents").Msg("Unable to retrieve events")
		return httperror.InternalServerError("Unable to retrieve events", err)
	}

	return response.JSON(w, events)
}
