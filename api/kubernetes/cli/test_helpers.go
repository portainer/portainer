package cli

import (
	"strconv"

	portainer "github.com/portainer/portainer/api"
	"k8s.io/client-go/kubernetes"
)

// NewTestClientFactory creates a ClientFactory with a pre-seeded KubeClient for
// a specific endpoint ID. Intended for use in tests across packages that need to
// inject a fake Kubernetes client without a real cluster connection.
func NewTestClientFactory(endpointID portainer.EndpointID, kcl *KubeClient) *ClientFactory {
	factory, _ := NewClientFactory(nil, nil, nil, "test", "", "")
	factory.endpointProxyClients.Set(strconv.Itoa(int(endpointID)), kcl, 0)
	return factory
}

// NewTestKubeClient creates a KubeClient backed by the provided kubernetes.Interface.
// Intended for use in tests.
func NewTestKubeClient(clientset kubernetes.Interface) *KubeClient {
	return &KubeClient{
		cli:         clientset,
		instanceID:  "test",
		isKubeAdmin: true,
	}
}
