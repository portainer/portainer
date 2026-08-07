package kubernetes

import (
	"net/http"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/rs/zerolog/log"
	corev1 "k8s.io/api/core/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
)

// KubernetesResourceQuotaListResponse is the documented response model for the
// resource quota list endpoint. It mirrors the Kubernetes list shape ({items: [...]}).
type KubernetesResourceQuotaListResponse corev1.ResourceQuotaList

// @id getKubernetesResourceQuotas
// @summary Get Kubernetes resource quotas within a namespace
// @description Get the list of Kubernetes resource quotas in the given namespace.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment(Endpoint) identifier"
// @param namespace path string true "Namespace"
// @success 200 {object} KubernetesResourceQuotaListResponse "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 500 "Server error occurred while attempting to retrieve the resource quotas within the specified namespace."
// @router /kubernetes/{id}/namespaces/{namespace}/resource_quotas [get]
func (handler *Handler) getKubernetesResourceQuotas(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		log.Error().Err(err).Str("context", "getKubernetesResourceQuotas").Msg("Unable to retrieve namespace identifier route variable")
		return httperror.BadRequest("Unable to retrieve namespace identifier route variable", err)
	}

	cli, httpErr := handler.prepareKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "getKubernetesResourceQuotas").Str("namespace", namespace).Msg("Unable to get a Kubernetes client for the user")
		return httperror.InternalServerError("Unable to get a Kubernetes client for the user", httpErr)
	}

	resourceQuotas, err := cli.GetResourceQuotas(namespace)
	if err != nil {
		if k8serrors.IsUnauthorized(err) || k8serrors.IsForbidden(err) {
			log.Error().Err(err).Str("context", "getKubernetesResourceQuotas").Str("namespace", namespace).Msg("Unauthorized access to the Kubernetes API")
			return httperror.Forbidden("Unauthorized access to the Kubernetes API", err)
		}

		log.Error().Err(err).Str("context", "getKubernetesResourceQuotas").Str("namespace", namespace).Msg("Unable to retrieve resource quotas")
		return httperror.InternalServerError("Unable to retrieve resource quotas", err)
	}

	items := []corev1.ResourceQuota{}
	if resourceQuotas != nil {
		items = *resourceQuotas
	}

	// Return the Kubernetes list shape ({items: [...]}) so it mirrors the raw API.
	return response.JSON(w, corev1.ResourceQuotaList{Items: items})
}
