package cli

import (
	"context"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// GetClusterNodes returns all nodes from the Kubernetes cluster.
func (kcl *KubeClient) GetClusterNodes() ([]corev1.Node, error) {
	nodes, err := kcl.cli.CoreV1().Nodes().List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	for i := range nodes.Items {
		nodes.Items[i].ManagedFields = nil
	}

	return nodes.Items, nil
}
