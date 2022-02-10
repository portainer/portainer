package kubernetes

import (
	"net/http"
)

func (transport *baseTransport) proxyDeploymentsRequest(request *http.Request, namespace, requestPath string) (*http.Response, error) {
	switch request.Method {
	case http.MethodPost, http.MethodPatch:
		transport.refreshRegistry(request, namespace)
		return transport.executeKubernetesRequest(request)
	default:
		return transport.executeKubernetesRequest(request)
	}
}
