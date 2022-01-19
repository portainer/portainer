package kubernetes

import (
	"net/http"
)

func (transport *baseTransport) proxyPodsRequest(request *http.Request, namespace, requestPath string) (*http.Response, error) {
	switch request.Method {
	case "DELETE":
		transport.refreshRegistry(request, namespace)
		return transport.executeKubernetesRequest(request)
	default:
		return transport.executeKubernetesRequest(request)
	}
}
