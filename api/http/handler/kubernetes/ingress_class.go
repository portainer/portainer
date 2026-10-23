package kubernetes

import (
	"net/http"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/rs/zerolog/log"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
)

// @id getKubernetesIngressClasses
// @summary Get Kubernetes ingress classes
// @description Get the list of Kubernetes ingress classes (cluster-scoped), as read
// @description models, distinct from the ingress controllers returned by /ingresscontrollers.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment(Endpoint) identifier"
// @success 200 {array} kubernetes.K8sIngressClass "Success"
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 500 "Server error occurred while attempting to retrieve the ingress classes."
// @router /kubernetes/{id}/ingressclasses [get]
func (handler *Handler) getKubernetesIngressClasses(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "getKubernetesIngressClasses").Msg("Unable to get a Kubernetes client for the user")
		return httperror.InternalServerError("Unable to get a Kubernetes client for the user", httpErr)
	}

	ingressClasses, err := cli.GetIngressClasses()
	if err != nil {
		if k8serrors.IsUnauthorized(err) || k8serrors.IsForbidden(err) {
			log.Error().Err(err).Str("context", "getKubernetesIngressClasses").Msg("Unauthorized access to the Kubernetes API")
			return httperror.Forbidden("Unauthorized access to the Kubernetes API", err)
		}

		log.Error().Err(err).Str("context", "getKubernetesIngressClasses").Msg("Unable to retrieve ingress classes")
		return httperror.InternalServerError("Unable to retrieve ingress classes", err)
	}

	return response.JSON(w, ingressClasses)
}
