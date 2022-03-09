package cli

import (
	"context"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	labels "k8s.io/apimachinery/pkg/labels"
)

// IsUniqueStackName Checks whether the given name is unique in the given namespace.
func (kcl *KubeClient) IsUniqueStackName(namespace string, stackName string) (bool, error) {
	querySet := labels.Set{"io.portainer.kubernetes.application.stack": stackName}
	listOpts := metav1.ListOptions{LabelSelector: labels.SelectorFromSet(querySet).String()}
	list, err := kcl.cli.AppsV1().Deployments(namespace).List(context.TODO(), listOpts)
	if err != nil {
		return false, err
	}
	if len(list.Items) > 0 {
		return false, nil
	}
	return true, nil
}
