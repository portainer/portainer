package kubernetes

import (
	"net/http"
)

func (transport *baseTransport) proxyPodsRequest(request *http.Request, namespace, requestPath string) (*http.Response, error) {
	if request.Method == http.MethodDelete {
		transport.refreshRegistry(request, namespace)
	}

	return transport.executeKubernetesRequest(request)
}
