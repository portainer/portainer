package kubernetes

import (
	"net/http"

	"github.com/pkg/errors"
)

func (transport *baseTransport) deleteNamespaceRequest(request *http.Request, namespace string) (*http.Response, error) {
	if err := transport.tokenManager.kubecli.NamespaceAccessPoliciesDeleteNamespace(namespace); err != nil {
		return nil, errors.WithMessagef(err, "failed to delete a namespace [%s] from portainer config", namespace)
	}

	return transport.executeKubernetesRequest(request, true)
}
