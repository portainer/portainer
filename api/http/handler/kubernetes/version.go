package kubernetes

import (
	"net/http"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/rs/zerolog/log"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/version"
)

// kubernetesVersionResponse is the shape returned by GetKubernetesVersion.
// It augments the standard Kubernetes /version payload with capability
// flags computed by Portainer (e.g. whether the API server registers the
// 1.35 alpha pod-restart subresource) so the UI can gate features without
// a second round-trip.
type kubernetesVersionResponse struct {
	*version.Info
	// SupportsPodRestart is true when the cluster exposes the `pods/restart`
	// subresource via API discovery — i.e. the feature gate is enabled and
	// the cluster version is recent enough. This is the authoritative
	// signal for whether Portainer can call the pod-restart endpoint, and
	// is preferred over a raw Kubernetes-version comparison.
	SupportsPodRestart bool `json:"supportsPodRestart"`
}

// @id GetKubernetesVersion
// @summary Get the Kubernetes cluster version and Portainer-relevant capabilities
// @description Get the Kubernetes cluster version (major, minor, gitVersion, ...)
// @description as reported by the cluster's discovery API, augmented with capability
// @description flags Portainer uses to gate UI features (e.g. supportsPodRestart).
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment(Endpoint) identifier"
// @success 200 {object} kubernetesVersionResponse "Success"
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation."
// @failure 404 "Unable to find an environment with the specified identifier."
// @failure 500 "Server error occurred while attempting to retrieve the cluster version."
// @router /kubernetes/{id}/version [get]
func (handler *Handler) getKubernetesVersion(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	cli, httpErr := handler.prepareKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "GetKubernetesVersion").Msg("Unable to get a Kubernetes client for the user")
		return httperror.InternalServerError("Unable to get a Kubernetes client for the user", httpErr)
	}

	info, err := cli.ServerVersion()
	if err != nil {
		if k8serrors.IsForbidden(err) {
			log.Error().Err(err).Str("context", "GetKubernetesVersion").Msg("Permission denied to retrieve cluster version")
			return httperror.Forbidden("Permission denied to retrieve cluster version", err)
		}
		log.Error().Err(err).Str("context", "GetKubernetesVersion").Msg("Unable to retrieve cluster version")
		return httperror.InternalServerError("Unable to retrieve cluster version", err)
	}

	// A discovery failure shouldn't fail the whole request — the cluster
	// version is still useful to the caller. We log it and treat the
	// capability as unsupported (safe default that hides the action).
	supportsPodRestart, err := cli.SupportsPodRestart(r.Context())
	if err != nil {
		log.Warn().Err(err).Str("context", "GetKubernetesVersion").Msg("Unable to probe pod-restart subresource via API discovery; assuming unsupported")
		supportsPodRestart = false
	}

	return response.JSON(w, kubernetesVersionResponse{
		Info:               info,
		SupportsPodRestart: supportsPodRestart,
	})
}
