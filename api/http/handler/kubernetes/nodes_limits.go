package kubernetes

import (
	"net/http"

	"github.com/portainer/portainer/api/http/middlewares"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/rs/zerolog/log"
)

// @id GetKubernetesNodesLimits
// @summary Get CPU and memory limits of all nodes within k8s cluster
// @description Get CPU and memory limits of all nodes within k8s cluster.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment(Endpoint) identifier"
// @success 200 {object} portainer.K8sNodesLimits "Success"
// @failure 400 "Invalid request"
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier."
// @failure 500 "Server error occurred while attempting to retrieve nodes limits."
// @router /kubernetes/{id}/nodes_limits [get]
func (handler *Handler) getKubernetesNodesLimits(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpoint, err := middlewares.FetchEndpoint(r)
	if err != nil {
		log.Error().Err(err).Str("context", "GetKubernetesNodesLimits").Msg("Unable to find an environment on request context")
		return httperror.NotFound("Unable to find an environment on request context", err)
	}

	cli, err := handler.KubernetesClientFactory.GetPrivilegedKubeClient(endpoint)
	if err != nil {
		log.Error().Err(err).Str("context", "GetKubernetesNodesLimits").Msg("Unable to create Kubernetes client")
		return httperror.InternalServerError("Unable to create Kubernetes client", err)
	}

	nodesLimits, err := cli.GetNodesLimits()
	if err != nil {
		log.Error().Err(err).Str("context", "GetKubernetesNodesLimits").Msg("Unable to retrieve nodes limits")
		return httperror.InternalServerError("Unable to retrieve nodes limits", err)
	}

	return response.JSON(w, nodesLimits)
}

// @id GetKubernetesMaxResourceLimits
// @summary Get max CPU and memory limits of all nodes within k8s cluster
// @description Get max CPU and memory limits (unused resources) of all nodes within k8s cluster.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment(Endpoint) identifier"
// @success 200 {object} portainer.K8sNodesLimits "Success"
// @failure 400 "Invalid request"
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier."
// @failure 500 "Server error occurred while attempting to retrieve nodes limits."
// @router /kubernetes/{id}/max_resource_limits [get]
func (handler *Handler) getKubernetesMaxResourceLimits(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpoint, err := middlewares.FetchEndpoint(r)
	if err != nil {
		log.Error().Err(err).Str("context", "GetKubernetesMaxResourceLimits").Msg("Unable to find an environment on request context")
		return httperror.NotFound("Unable to find an environment on request context", err)
	}

	cli, err := handler.KubernetesClientFactory.GetPrivilegedKubeClient(endpoint)
	if err != nil {
		log.Error().Err(err).Str("context", "GetKubernetesMaxResourceLimits").Msg("Unable to create Kubernetes client")
		return httperror.InternalServerError("Unable to create Kubernetes client", err)
	}

	overCommit := endpoint.Kubernetes.Configuration.EnableResourceOverCommit
	overCommitPercent := endpoint.Kubernetes.Configuration.ResourceOverCommitPercentage

	// name is set to "" so all namespaces resources are considered when calculating max resource limits
	resourceLimit, err := cli.GetMaxResourceLimits("", overCommit, overCommitPercent)
	if err != nil {
		log.Error().Err(err).Str("context", "GetKubernetesMaxResourceLimits").Msg("Unable to retrieve max resource limit")
		return httperror.InternalServerError("Unable to retrieve max resource limit", err)
	}

	return response.JSON(w, resourceLimit)
}
