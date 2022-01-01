package exectest

import (
	portainer "github.com/portainer/portainer/api"
)

type kubernetesMockDeployer struct{}

func NewKubernetesDeployer() portainer.KubernetesDeployer {
	return &kubernetesMockDeployer{}
}

func (deployer *kubernetesMockDeployer) Deploy(userID portainer.UserID, endpoint *portainer.Endpoint, manifestFiles []string, namespace string) (string, error) {
	return "", nil
}

func (deployer *kubernetesMockDeployer) Remove(userID portainer.UserID, endpoint *portainer.Endpoint, manifestFiles []string, namespace string) (string, error) {
	return "", nil
}

func (deployer *kubernetesMockDeployer) ConvertCompose(data []byte) ([]byte, error) {
	return nil, nil
}
