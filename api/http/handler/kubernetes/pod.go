package kubernetes

import (
	"context"
	"errors"
	"io"
	"net/http"
	"strconv"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/rs/zerolog/log"
	corev1 "k8s.io/api/core/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
)

// KubernetesPodListResponse is the documented response model for pod list endpoints.
// It mirrors the Kubernetes list shape ({items: [...]}).
type KubernetesPodListResponse corev1.PodList

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

// @id getAllKubernetesPods
// @summary Get Kubernetes pods
// @description Get the list of Kubernetes pods across all namespaces the user can access.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment(Endpoint) identifier"
// @param labelSelector query string false "Kubernetes label selector to filter the pods (e.g. app=nginx)"
// @param fieldSelector query string false "Kubernetes field selector to filter the pods (e.g. status.phase=Running)"
// @success 200 {object} KubernetesPodListResponse "Success"
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 500 "Server error occurred while attempting to retrieve the pods."
// @router /kubernetes/{id}/pods [get]
func (handler *Handler) getAllKubernetesPods(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	cli, httpErr := handler.prepareKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "getAllKubernetesPods").Msg("Unable to get a Kubernetes client for the user")
		return httperror.InternalServerError("Unable to get a Kubernetes client for the user", httpErr)
	}

	pods, err := cli.GetPods("", parseK8sListOptions(r))
	if err != nil {
		if k8serrors.IsUnauthorized(err) || k8serrors.IsForbidden(err) {
			log.Error().Err(err).Str("context", "getAllKubernetesPods").Msg("Unauthorized access to the Kubernetes API")
			return httperror.Forbidden("Unauthorized access to the Kubernetes API", err)
		}

		log.Error().Err(err).Str("context", "getAllKubernetesPods").Msg("Unable to retrieve pods")
		return httperror.InternalServerError("Unable to retrieve pods", err)
	}

	// Return the Kubernetes list shape ({items: [...]}) so it mirrors the raw API.
	return response.JSON(w, corev1.PodList{Items: pods})
}

// @id getKubernetesPodsForNamespace
// @summary Get Kubernetes pods within a namespace
// @description Get the list of Kubernetes pods in the given namespace.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment(Endpoint) identifier"
// @param namespace path string true "Namespace"
// @param labelSelector query string false "Kubernetes label selector to filter the pods (e.g. app=nginx)"
// @param fieldSelector query string false "Kubernetes field selector to filter the pods (e.g. status.phase=Running)"
// @success 200 {object} KubernetesPodListResponse "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 500 "Server error occurred while attempting to retrieve the pods within the specified namespace."
// @router /kubernetes/{id}/namespaces/{namespace}/pods [get]
func (handler *Handler) getKubernetesPodsForNamespace(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		log.Error().Err(err).Str("context", "getKubernetesPodsForNamespace").Msg("Unable to retrieve namespace identifier route variable")
		return httperror.BadRequest("Unable to retrieve namespace identifier route variable", err)
	}

	cli, httpErr := handler.prepareKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "getKubernetesPodsForNamespace").Str("namespace", namespace).Msg("Unable to get a Kubernetes client for the user")
		return httperror.InternalServerError("Unable to get a Kubernetes client for the user", httpErr)
	}

	pods, err := cli.GetPods(namespace, parseK8sListOptions(r))
	if err != nil {
		if k8serrors.IsUnauthorized(err) || k8serrors.IsForbidden(err) {
			log.Error().Err(err).Str("context", "getKubernetesPodsForNamespace").Str("namespace", namespace).Msg("Unauthorized access to the Kubernetes API")
			return httperror.Forbidden("Unauthorized access to the Kubernetes API", err)
		}

		log.Error().Err(err).Str("context", "getKubernetesPodsForNamespace").Str("namespace", namespace).Msg("Unable to retrieve pods")
		return httperror.InternalServerError("Unable to retrieve pods", err)
	}

	// Return the Kubernetes list shape ({items: [...]}) so it mirrors the raw API.
	return response.JSON(w, corev1.PodList{Items: pods})
}

// podLogStreamChunkSize is the read buffer size used when relaying the pod log
// stream to the client. Kubernetes returns whatever is currently available on each
// read, so this only caps the per-write chunk size.
const podLogStreamChunkSize = 2048

// @id getKubernetesPodLogs
// @summary Get logs for a Kubernetes pod
// @description Stream the logs for a pod in the given namespace as text/plain. When
// @description follow is set the response stays open and emits new log lines until the
// @description client disconnects. When the pod has more than one container, the
// @description container query parameter is required.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce plain
// @param id path int true "Environment(Endpoint) identifier"
// @param namespace path string true "Namespace"
// @param name path string true "Pod name"
// @param container query string false "Container name (required when the pod has multiple containers)"
// @param tailLines query int false "Number of lines from the end of the logs to return"
// @param sinceSeconds query int false "Only return logs newer than this many seconds"
// @param timestamps query bool false "Prefix each log line with an RFC3339 timestamp"
// @param previous query bool false "Return the logs of the previous terminated container instance"
// @param follow query bool false "Stream new log lines as they are produced until the client disconnects"
// @success 200 {string} string "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 500 "Server error occurred while attempting to retrieve the pod logs."
// @router /kubernetes/{id}/namespaces/{namespace}/pods/{name}/log [get]
func (handler *Handler) getKubernetesPodLogs(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, podName, httpErr := parseNamespaceAndPodName(r)
	if httpErr != nil {
		return httpErr
	}

	opts, httpErr := parsePodLogOptions(r)
	if httpErr != nil {
		return httpErr
	}

	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "getKubernetesPodLogs").Str("namespace", namespace).Str("pod", podName).Msg("Unable to get a Kubernetes client for the user")
		return httperror.InternalServerError("Unable to get a Kubernetes client for the user", httpErr)
	}

	stream, err := cli.GetPodLogsStream(r.Context(), namespace, podName, opts)
	if err != nil {
		if k8serrors.IsUnauthorized(err) || k8serrors.IsForbidden(err) {
			log.Error().Err(err).Str("context", "getKubernetesPodLogs").Str("namespace", namespace).Str("pod", podName).Msg("Unauthorized access to the Kubernetes API")
			return httperror.Forbidden("Unauthorized access to the Kubernetes API", err)
		}

		if k8serrors.IsNotFound(err) {
			log.Error().Err(err).Str("context", "getKubernetesPodLogs").Str("namespace", namespace).Str("pod", podName).Msg("Unable to retrieve pod logs")
			return httperror.NotFound("Unable to retrieve pod logs", err)
		}

		log.Error().Err(err).Str("context", "getKubernetesPodLogs").Str("namespace", namespace).Str("pod", podName).Msg("Unable to retrieve pod logs")
		return httperror.InternalServerError("Unable to retrieve pod logs", err)
	}
	defer func() {
		if closeErr := stream.Close(); closeErr != nil {
			log.Debug().Err(closeErr).Str("context", "getKubernetesPodLogs").Str("namespace", namespace).Str("pod", podName).Msg("Error closing pod log stream")
		}
	}()

	// Once the first bytes are written the status code is fixed, so every failure
	// that needs a specific status must be handled before this point.
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.Header().Set("X-Content-Type-Options", "nosniff")

	if relayErr := relayPodLogStream(r.Context(), w, stream); relayErr != nil {
		// The status code is already committed, so the client sees a successful
		// response with a truncated body. Record it so the gap is explainable.
		log.Error().Err(relayErr).Str("context", "getKubernetesPodLogs").Str("namespace", namespace).Str("pod", podName).Msg("Pod log stream ended early, the returned logs are truncated")
	}

	return nil
}

// relayPodLogStream writes the pod log stream to the response as it arrives and
// returns the error that cut the stream short. It returns nil when the stream ended
// on its own or the client went away, neither of which loses log lines.
func relayPodLogStream(ctx context.Context, w http.ResponseWriter, stream io.Reader) error {
	flusher, _ := w.(http.Flusher)
	buf := make([]byte, podLogStreamChunkSize)
	for {
		n, readErr := stream.Read(buf)
		if n > 0 {
			if _, writeErr := w.Write(buf[:n]); writeErr != nil {
				return nil // client disconnected mid-stream
			}
			if flusher != nil {
				flusher.Flush()
			}
		}

		if readErr != nil {
			// io.EOF ends a non-follow stream; a cancelled request context ends a
			// follow stream.
			if errors.Is(readErr, io.EOF) || ctx.Err() != nil {
				return nil
			}

			return readErr
		}
	}
}

// parsePodLogOptions builds the Kubernetes pod log options from the request query parameters.
func parsePodLogOptions(r *http.Request) (corev1.PodLogOptions, *httperror.HandlerError) {
	opts := corev1.PodLogOptions{}

	container, _ := request.RetrieveQueryParameter(r, "container", true)
	opts.Container = container

	if tailLines, _ := request.RetrieveQueryParameter(r, "tailLines", true); tailLines != "" {
		n, err := strconv.ParseInt(tailLines, 10, 64)
		if err != nil {
			log.Error().Err(err).Str("context", "parsePodLogOptions").Msg("Invalid tailLines query parameter")
			return opts, httperror.BadRequest("Invalid tailLines query parameter", err)
		}
		opts.TailLines = &n
	}

	if sinceSeconds, _ := request.RetrieveQueryParameter(r, "sinceSeconds", true); sinceSeconds != "" {
		s, err := strconv.ParseInt(sinceSeconds, 10, 64)
		if err != nil {
			log.Error().Err(err).Str("context", "parsePodLogOptions").Msg("Invalid sinceSeconds query parameter")
			return opts, httperror.BadRequest("Invalid sinceSeconds query parameter", err)
		}
		opts.SinceSeconds = &s
	}

	opts.Timestamps, _ = request.RetrieveBooleanQueryParameter(r, "timestamps", true)
	opts.Previous, _ = request.RetrieveBooleanQueryParameter(r, "previous", true)
	opts.Follow, _ = request.RetrieveBooleanQueryParameter(r, "follow", true)

	return opts, nil
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
