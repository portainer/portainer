package kubernetes

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// @id getKubernetesMetricsForAllNodes
// @summary Get a list of nodes with their live metrics
// @description Get a list of nodes with their live metrics
// @description **Access policy**: authenticated
// @tags kubernetes
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Environment (Endpoint) identifier"
// @success 200 {object} v1beta1.NodeMetricsList "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /kubernetes/{id}/metrics/nodes [get]
func (handler *Handler) getKubernetesMetricsForAllNodes(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest(
			"Invalid environment identifier route variable",
			err,
		)
	}
	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find an environment with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find an environment with the specified identifier inside the database", err)
	}

	cli, err := handler.KubernetesClientFactory.CreateRemoteMetricsClient(endpoint)
	if err != nil {
		return httperror.InternalServerError(
			"failed to create metrics KubeClient",
			nil,
		)
	}

	metrics, err := cli.MetricsV1beta1().NodeMetricses().List(r.Context(), v1.ListOptions{})
	if err != nil {
		return httperror.InternalServerError(
			"Failed to fetch metrics",
			err,
		)
	}

	return response.JSON(w, metrics)
}

// @id getKubernetesMetricsForNode
// @summary Get live metrics for a node
// @description Get live metrics for a node
// @description **Access policy**: authenticated
// @tags kubernetes
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Environment (Endpoint) identifier"
// @param name path string true "Node identifier"
// @success 200 {object} v1beta1.NodeMetrics "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /kubernetes/{id}/metrics/nodes/{name} [get]
func (handler *Handler) getKubernetesMetricsForNode(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest(
			"Invalid environment identifier route variable",
			err,
		)
	}
	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find an environment with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find an environment with the specified identifier inside the database", err)
	}

	cli, err := handler.KubernetesClientFactory.CreateRemoteMetricsClient(endpoint)
	if err != nil {
		return httperror.InternalServerError(
			"failed to create metrics KubeClient",
			nil,
		)
	}

	nodeName, err := request.RetrieveRouteVariableValue(r, "name")
	if err != nil {
		return httperror.BadRequest(
			"Invalid node identifier route variable",
			err,
		)
	}

	metrics, err := cli.MetricsV1beta1().NodeMetricses().Get(
		r.Context(),
		nodeName,
		v1.GetOptions{},
	)
	if err != nil {
		return httperror.InternalServerError(
			"Failed to fetch metrics",
			err,
		)
	}

	return response.JSON(w, metrics)
}

// @id getKubernetesMetricsForAllPods
// @summary Get a list of pods with their live metrics
// @description Get a list of pods with their live metrics
// @description **Access policy**: authenticated
// @tags kubernetes
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Environment (Endpoint) identifier"
// @param namespace path string true "Namespace"
// @success 200 {object} v1beta1.PodMetricsList "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /kubernetes/{id}/metrics/pods/{namespace} [get]
func (handler *Handler) getKubernetesMetricsForAllPods(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest(
			"Invalid environment identifier route variable",
			err,
		)
	}
	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find an environment with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find an environment with the specified identifier inside the database", err)
	}

	cli, err := handler.KubernetesClientFactory.CreateRemoteMetricsClient(endpoint)
	if err != nil {
		return httperror.InternalServerError(
			"failed to create metrics KubeClient",
			nil,
		)
	}

	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		return httperror.BadRequest(
			"Invalid namespace identifier route variable",
			err,
		)
	}

	metrics, err := cli.MetricsV1beta1().PodMetricses(namespace).List(r.Context(), v1.ListOptions{})
	if err != nil {
		return httperror.InternalServerError(
			"Failed to fetch metrics",
			err,
		)
	}

	return response.JSON(w, metrics)
}

// @id getKubernetesMetricsForPod
// @summary Get live metrics for a pod
// @description Get live metrics for a pod
// @description **Access policy**: authenticated
// @tags kubernetes
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Environment (Endpoint) identifier"
// @param namespace path string true "Namespace"
// @param name path string true "Pod identifier"
// @success 200 {object} v1beta1.PodMetrics "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /kubernetes/{id}/metrics/pods/{namespace}/{name} [get]
func (handler *Handler) getKubernetesMetricsForPod(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest(
			"Invalid environment identifier route variable",
			err,
		)
	}
	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find an environment with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find an environment with the specified identifier inside the database", err)
	}

	cli, err := handler.KubernetesClientFactory.CreateRemoteMetricsClient(endpoint)
	if err != nil {
		return httperror.InternalServerError(
			"failed to create metrics KubeClient",
			nil,
		)
	}

	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		return httperror.BadRequest(
			"Invalid namespace identifier route variable",
			err,
		)
	}

	podName, err := request.RetrieveRouteVariableValue(r, "name")
	if err != nil {
		return httperror.BadRequest(
			"Invalid pod identifier route variable",
			err,
		)
	}

	metrics, err := cli.MetricsV1beta1().PodMetricses(namespace).Get(
		r.Context(),
		podName,
		v1.GetOptions{},
	)
	if err != nil {
		return httperror.InternalServerError(
			"Failed to fetch metrics",
			err,
		)
	}

	return response.JSON(w, metrics)
}
