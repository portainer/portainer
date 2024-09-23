package kubernetes

import (
	"net/http"

	"github.com/portainer/portainer/api/http/middlewares"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/rs/zerolog/log"

	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// @id GetKubernetesMetricsForAllNodes
// @summary Get a list of nodes with their live metrics
// @description Get a list of metrics associated with all nodes of a cluster.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @success 200 {object} v1beta1.NodeMetricsList "Success"
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 500 "Server error occurred while attempting to retrieve the list of nodes with their live metrics."
// @router /kubernetes/{id}/metrics/nodes [get]
func (handler *Handler) getKubernetesMetricsForAllNodes(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpoint, err := middlewares.FetchEndpoint(r)
	if err != nil {
		return httperror.InternalServerError(err.Error(), err)
	}

	cli, err := handler.KubernetesClientFactory.CreateRemoteMetricsClient(endpoint)
	if err != nil {
		log.Error().Err(err).Str("context", "getKubernetesMetricsForAllNodes").Msg("Failed to create metrics KubeClient")
		return httperror.InternalServerError("failed to create metrics KubeClient", nil)
	}

	metrics, err := cli.MetricsV1beta1().NodeMetricses().List(r.Context(), v1.ListOptions{})
	if err != nil {
		log.Error().Err(err).Str("context", "getKubernetesMetricsForAllNodes").Msg("Failed to fetch metrics")
		return httperror.InternalServerError("Failed to fetch metrics", err)
	}

	return response.JSON(w, metrics)
}

// @id GetKubernetesMetricsForNode
// @summary Get live metrics for a node
// @description Get live metrics for the specified node.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @param name path string true "Node identifier"
// @success 200 {object} v1beta1.NodeMetrics "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 500 "Server error occurred while attempting to retrieve the live metrics for the specified node."
// @router /kubernetes/{id}/metrics/nodes/{name} [get]
func (handler *Handler) getKubernetesMetricsForNode(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpoint, err := middlewares.FetchEndpoint(r)
	if err != nil {
		log.Error().Err(err).Str("context", "getKubernetesMetricsForNode").Msg("Failed to fetch endpoint")
		return httperror.InternalServerError(err.Error(), err)
	}

	cli, err := handler.KubernetesClientFactory.CreateRemoteMetricsClient(endpoint)
	if err != nil {
		log.Error().Err(err).Str("context", "getKubernetesMetricsForNode").Msg("Failed to create metrics KubeClient")
		return httperror.InternalServerError("failed to create metrics KubeClient", nil)
	}

	nodeName, err := request.RetrieveRouteVariableValue(r, "name")
	if err != nil {
		log.Error().Err(err).Str("context", "getKubernetesMetricsForNode").Msg("Invalid node identifier route variable")
		return httperror.BadRequest("Invalid node identifier route variable", err)
	}

	metrics, err := cli.MetricsV1beta1().NodeMetricses().Get(
		r.Context(),
		nodeName,
		v1.GetOptions{},
	)
	if err != nil {
		log.Error().Err(err).Str("context", "getKubernetesMetricsForNode").Msg("Failed to fetch metrics")
		return httperror.InternalServerError("Failed to fetch metrics", err)
	}

	return response.JSON(w, metrics)
}

// @id GetKubernetesMetricsForAllPods
// @summary Get a list of pods with their live metrics
// @description Get a list of pods with their live metrics for the specified namespace.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @param namespace path string true "Namespace"
// @success 200 {object} v1beta1.PodMetricsList "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 500 "Server error occurred while attempting to retrieve the list of pods with their live metrics."
// @router /kubernetes/{id}/metrics/pods/{namespace} [get]
func (handler *Handler) getKubernetesMetricsForAllPods(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpoint, err := middlewares.FetchEndpoint(r)
	if err != nil {
		log.Error().Err(err).Str("context", "getKubernetesMetricsForAllPods").Msg("Failed to fetch endpoint")
		return httperror.InternalServerError(err.Error(), err)
	}

	cli, err := handler.KubernetesClientFactory.CreateRemoteMetricsClient(endpoint)
	if err != nil {
		log.Error().Err(err).Str("context", "getKubernetesMetricsForAllPods").Msg("Failed to create metrics KubeClient")
		return httperror.InternalServerError("failed to create metrics KubeClient", nil)
	}

	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		log.Error().Err(err).Str("context", "getKubernetesMetricsForAllPods").Msg("Invalid namespace identifier route variable")
		return httperror.BadRequest("Invalid namespace identifier route variable", err)
	}

	metrics, err := cli.MetricsV1beta1().PodMetricses(namespace).List(r.Context(), v1.ListOptions{})
	if err != nil {
		log.Error().Err(err).Str("context", "getKubernetesMetricsForAllPods").Msg("Failed to fetch metrics")
		return httperror.InternalServerError("Failed to fetch metrics", err)
	}

	return response.JSON(w, metrics)
}

// @id GetKubernetesMetricsForPod
// @summary Get live metrics for a pod
// @description Get live metrics for the specified pod.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @param namespace path string true "Namespace"
// @param name path string true "Pod identifier"
// @success 200 {object} v1beta1.PodMetrics "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 500 "Server error occurred while attempting to retrieve the live metrics for the specified pod."
// @router /kubernetes/{id}/metrics/pods/{namespace}/{name} [get]
func (handler *Handler) getKubernetesMetricsForPod(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpoint, err := middlewares.FetchEndpoint(r)
	if err != nil {
		log.Error().Err(err).Str("context", "getKubernetesMetricsForPod").Msg("Failed to fetch endpoint")
		return httperror.InternalServerError(err.Error(), err)
	}

	cli, err := handler.KubernetesClientFactory.CreateRemoteMetricsClient(endpoint)
	if err != nil {
		log.Error().Err(err).Str("context", "getKubernetesMetricsForPod").Msg("Failed to create metrics KubeClient")
		return httperror.InternalServerError("failed to create metrics KubeClient", nil)
	}

	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		log.Error().Err(err).Str("context", "getKubernetesMetricsForPod").Msg("Invalid namespace identifier route variable")
		return httperror.BadRequest("Invalid namespace identifier route variable", err)
	}

	podName, err := request.RetrieveRouteVariableValue(r, "name")
	if err != nil {
		log.Error().Err(err).Str("context", "getKubernetesMetricsForPod").Msg("Invalid pod identifier route variable")
		return httperror.BadRequest("Invalid pod identifier route variable", err)
	}

	metrics, err := cli.MetricsV1beta1().PodMetricses(namespace).Get(r.Context(), podName, v1.GetOptions{})
	if err != nil {
		log.Error().Err(err).Str("context", "getKubernetesMetricsForPod").Str("namespace", namespace).Str("pod", podName).Msg("Failed to fetch metrics")
		return httperror.InternalServerError("Failed to fetch metrics", err)
	}

	return response.JSON(w, metrics)
}
