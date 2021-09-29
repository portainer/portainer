package exectest

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
)

type kubernetesMockDeployer struct{}

func NewKubernetesDeployer() portainer.KubernetesDeployer {
	return &kubernetesMockDeployer{}
}

func (deployer *kubernetesMockDeployer) Deploy(request *http.Request, endpoint *portainer.Endpoint, data string, namespace string) (string, error) {
	return "", nil
}

func (deployer *kubernetesMockDeployer) ConvertCompose(data []byte) ([]byte, error) {
	return nil, nil
}
