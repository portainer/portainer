package cli

import (
	"context"

	portainer "github.com/portainer/portainer/api"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// GetDeployments will get deployments within a given namespace.
// If the parameter 'namespace' is an empty string, all deployments in the kubernetes env will be retrived.
func (kcl *KubeClient) GetDeployments(namespace string) ([]portainer.KubernetesDeployment, error) {
	list, err := kcl.cli.AppsV1().Deployments(namespace).List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return []portainer.KubernetesDeployment{}, err
	}
	deployments := make([]portainer.KubernetesDeployment, 0, len(list.Items))
	for index := range list.Items {
		deployments = append(deployments, portainer.KubernetesDeployment{
			Namespace: list.Items[index].Namespace,
			Name:      list.Items[index].Name,
			StackName: list.Items[index].Labels["io.portainer.kubernetes.application.stack"],
		})
	}
	return deployments, nil
}
