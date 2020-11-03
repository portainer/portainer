package cli

import (
	portainer "github.com/portainer/portainer/api"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func defaultSystemNamespaces() map[string]struct{} {
	return map[string]struct{}{
		"kube-system":     struct{}{},
		"kube-public":     struct{}{},
		"kube-node-lease": struct{}{},
		"portainer":       struct{}{},
	}
}

// GetNamespaces gets the namespaces in the current k8s endpoint connection
func (kcl *KubeClient) GetNamespaces() (map[string]portainer.K8sNamespaceInfo, error) {
	namespaces, err := kcl.cli.CoreV1().Namespaces().List(metav1.ListOptions{})
	if err != nil {
		return nil, err
	}
	results := make(map[string]portainer.K8sNamespaceInfo)
	systemNamespaces := defaultSystemNamespaces()
	for _, ns := range namespaces.Items {
		// setup the namespace properties if its a system or default namespace
		_, isSystem := systemNamespaces[ns.Name]
		results[ns.Name] = portainer.K8sNamespaceInfo{
			IsSystem:  isSystem,
			IsDefault: ns.Name == defaultNamespace,
		}
	}

	return results, nil
}
