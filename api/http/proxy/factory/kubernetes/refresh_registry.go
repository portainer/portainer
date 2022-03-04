package kubernetes

import (
	"github.com/portainer/portainer/api/internal/registryutils"
	"net/http"
)

func (transport *baseTransport) refreshRegistry(request *http.Request, namespace string) (err error) {
	cli, err := transport.k8sClientFactory.GetKubeClient(transport.endpoint)
	if err != nil {
		return
	}

	err = registryutils.RefreshEcrSecret(cli, transport.endpoint, transport.dataStore, namespace)

	return
}
