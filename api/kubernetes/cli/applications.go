package cli

import (
	"context"
	"strings"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// GetApplications gets a list of kubernetes workloads (or applications) by kind.  If Kind is not specified, gets the all
func (kcl *KubeClient) GetApplications(namespace, kind string) ([]models.K8sApplication, error) {
	applicationList := []models.K8sApplication{}
	listOpts := metav1.ListOptions{}

	if kind == "" || strings.EqualFold(kind, "deployment") {
		deployments, err := kcl.cli.AppsV1().Deployments(namespace).List(context.TODO(), listOpts)
		if err != nil {
			return nil, err
		}

		for _, d := range deployments.Items {
			applicationList = append(applicationList, models.K8sApplication{
				UID:       string(d.UID),
				Name:      d.Name,
				Namespace: d.Namespace,
				Kind:      "Deployment",
				Labels:    d.Labels,
			})
		}
	}

	if kind == "" || strings.EqualFold(kind, "statefulset") {
		statefulSets, err := kcl.cli.AppsV1().StatefulSets(namespace).List(context.TODO(), listOpts)
		if err != nil {
			return nil, err
		}

		for _, s := range statefulSets.Items {
			applicationList = append(applicationList, models.K8sApplication{
				UID:       string(s.UID),
				Name:      s.Name,
				Namespace: s.Namespace,
				Kind:      "StatefulSet",
				Labels:    s.Labels,
			})
		}
	}

	if kind == "" || strings.EqualFold(kind, "daemonset") {
		daemonSets, err := kcl.cli.AppsV1().DaemonSets(namespace).List(context.TODO(), listOpts)
		if err != nil {
			return nil, err
		}

		for _, d := range daemonSets.Items {
			applicationList = append(applicationList, models.K8sApplication{
				UID:       string(d.UID),
				Name:      d.Name,
				Namespace: d.Namespace,
				Kind:      "DaemonSet",
				Labels:    d.Labels,
			})
		}
	}

	if kind == "" || strings.EqualFold(kind, "nakedpods") {
		pods, _ := kcl.cli.CoreV1().Pods(namespace).List(context.Background(), metav1.ListOptions{})
		for _, pod := range pods.Items {
			naked := false
			if len(pod.OwnerReferences) == 0 {
				naked = true
			} else {
				managed := false
			loop:
				for _, ownerRef := range pod.OwnerReferences {
					switch ownerRef.Kind {
					case "Deployment", "DaemonSet", "ReplicaSet":
						managed = true
						break loop
					}
				}

				if !managed {
					naked = true
				}
			}

			if naked {
				applicationList = append(applicationList, models.K8sApplication{
					UID:       string(pod.UID),
					Name:      pod.Name,
					Namespace: pod.Namespace,
					Kind:      "Pod",
					Labels:    pod.Labels,
				})
			}
		}
	}

	return applicationList, nil
}

// GetApplication gets a kubernetes workload (application) by kind and name.  If Kind is not specified, gets the all
func (kcl *KubeClient) GetApplication(namespace, kind, name string) (models.K8sApplication, error) {

	opts := metav1.GetOptions{}

	switch strings.ToLower(kind) {
	case "deployment":
		d, err := kcl.cli.AppsV1().Deployments(namespace).Get(context.TODO(), name, opts)
		if err != nil {
			return models.K8sApplication{}, err
		}

		return models.K8sApplication{
			UID:       string(d.UID),
			Name:      d.Name,
			Namespace: d.Namespace,
			Kind:      "Deployment",
			Labels:    d.Labels,
		}, nil

	case "statefulset":
		s, err := kcl.cli.AppsV1().StatefulSets(namespace).Get(context.TODO(), name, opts)
		if err != nil {
			return models.K8sApplication{}, err
		}

		return models.K8sApplication{
			UID:       string(s.UID),
			Name:      s.Name,
			Namespace: s.Namespace,
			Kind:      "StatefulSet",
			Labels:    s.Labels,
		}, nil

	case "daemonset":
		d, err := kcl.cli.AppsV1().DaemonSets(namespace).Get(context.TODO(), name, opts)
		if err != nil {
			return models.K8sApplication{}, err
		}

		return models.K8sApplication{
			UID:       string(d.UID),
			Name:      d.Name,
			Namespace: d.Namespace,
			Kind:      "DaemonSet",
			Labels:    d.Labels,
		}, nil
	}

	return models.K8sApplication{}, nil
}
