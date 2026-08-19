package kubernetes

import (
	"net/http"

	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/internal/registryutils"
)

func (transport *baseTransport) refreshRegistry(request *http.Request, namespace string) error {
	cli, err := transport.k8sClientFactory.GetPrivilegedKubeClient(transport.endpoint)
	if err != nil {
		return err
	}

	return transport.dataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return registryutils.RefreshEcrSecret(tx, cli, transport.endpoint, namespace)
	})
}
