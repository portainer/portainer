package exectest

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/database"
)

type kubernetesMockDeployer struct{}

func NewKubernetesDeployer() portainer.KubernetesDeployer {
	return &kubernetesMockDeployer{}
}

func (deployer *kubernetesMockDeployer) Deploy(userID database.UserID, endpoint *portainer.Endpoint, manifestFiles []string, namespace string) (string, error) {
	return "", nil
}

func (deployer *kubernetesMockDeployer) Remove(userID database.UserID, endpoint *portainer.Endpoint, manifestFiles []string, namespace string) (string, error) {
	return "", nil
}

func (deployer *kubernetesMockDeployer) ConvertCompose(data []byte) ([]byte, error) {
	return nil, nil
}
