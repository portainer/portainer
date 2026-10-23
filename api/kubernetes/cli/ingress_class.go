package cli

import (
	"context"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// ingressClassDefaultAnnotation marks the cluster's default ingress class.
const ingressClassDefaultAnnotation = "ingressclass.kubernetes.io/is-default-class"

// GetIngressClasses returns the cluster's ingress classes as read models. This is
// distinct from the K8sIngressController model returned by GetIngressControllers.
func (kcl *KubeClient) GetIngressClasses() ([]models.K8sIngressClass, error) {
	ingressClasses, err := kcl.cli.NetworkingV1().IngressClasses().List(context.Background(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	results := make([]models.K8sIngressClass, 0, len(ingressClasses.Items))
	for _, class := range ingressClasses.Items {
		results = append(results, models.K8sIngressClass{
			Name:        class.Name,
			Controller:  class.Spec.Controller,
			IsDefault:   class.Annotations[ingressClassDefaultAnnotation] == "true",
			Annotations: class.Annotations,
		})
	}

	return results, nil
}
