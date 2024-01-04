package kubernetes

import (
	"net/http"

	"github.com/portainer/portainer/api/http/middlewares"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @id GetKubernetesNodesLimits
// @summary Get CPU and memory limits of all nodes within k8s cluster
// @description Get CPU and memory limits of all nodes within k8s cluster
// @description **Access policy**: authenticated
// @tags kubernetes
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Environment(Endpoint) identifier"
// @success 200 {object} portainer.K8sNodesLimits "Success"
// @failure 400 "Invalid request"
// @failure 401 "Unauthorized"
// @failure 403 "Permission denied"
// @failure 404 "Environment(Endpoint) not found"
// @failure 500 "Server error"
// @router /kubernetes/{id}/nodes_limits [get]
func (handler *Handler) getKubernetesNodesLimits(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpoint, err := middlewares.FetchEndpoint(r)
	if err != nil {
		return httperror.NotFound("Unable to find an environment on request context", err)
	}

	cli, err := handler.KubernetesClientFactory.GetKubeClient(endpoint)
	if err != nil {
		return httperror.InternalServerError("Unable to create Kubernetes client", err)
	}

	nodesLimits, err := cli.GetNodesLimits()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve nodes limits", err)
	}

	return response.JSON(w, nodesLimits)
}

func (handler *Handler) getKubernetesMaxResourceLimits(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpoint, err := middlewares.FetchEndpoint(r)
	if err != nil {
		return httperror.NotFound("Unable to find an environment on request context", err)
	}

	cli, err := handler.KubernetesClientFactory.GetKubeClient(endpoint)
	if err != nil {
		return httperror.InternalServerError("Failed to lookup KubeClient", err)
	}

	overCommit := endpoint.Kubernetes.Configuration.EnableResourceOverCommit
	overCommitPercent := endpoint.Kubernetes.Configuration.ResourceOverCommitPercentage

	// name is set to "" so all namespaces resources are considered when calculating max resource limits
	resourceLimit, err := cli.GetMaxResourceLimits("", overCommit, overCommitPercent)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve max resource limit", err)
	}

	return response.JSON(w, resourceLimit)
}
