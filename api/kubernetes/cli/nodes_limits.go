package cli

import (
	"context"

	portainer "github.com/portainer/portainer/api"
	"github.com/rs/zerolog/log"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// GetNodesLimits gets the CPU and Memory limits(unused resources) of all nodes in the current k8s environment(endpoint) connection
func (kcl *KubeClient) GetNodesLimits() (portainer.K8sNodesLimits, error) {
	nodesLimits := make(portainer.K8sNodesLimits)

	nodes, err := kcl.cli.CoreV1().Nodes().List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	pods, err := kcl.cli.CoreV1().Pods("").List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	for _, item := range nodes.Items {
		cpu := item.Status.Allocatable.Cpu().MilliValue()
		memory := item.Status.Allocatable.Memory().Value() // bytes

		nodesLimits[item.ObjectMeta.Name] = &portainer.K8sNodeLimits{
			CPU:    cpu,
			Memory: memory,
		}
	}

	for _, item := range pods.Items {
		if nodeLimits, ok := nodesLimits[item.Spec.NodeName]; ok {
			for _, container := range item.Spec.Containers {
				nodeLimits.CPU -= container.Resources.Requests.Cpu().MilliValue()
				nodeLimits.Memory -= container.Resources.Requests.Memory().Value()
			}
		}
	}

	return nodesLimits, nil
}

// GetMaxResourceLimits gets the maximum CPU and Memory limits(unused resources) of all nodes in the current k8s environment(endpoint) connection, minus the accumulated resourcequotas for all namespaces except the one we're editing (skipNamespace)
// if skipNamespace is set to "" then all namespaces are considered
func (client *KubeClient) GetMaxResourceLimits(skipNamespace string, overCommitEnabled bool, resourceOverCommitPercent int) (portainer.K8sNodeLimits, error) {
	limits := portainer.K8sNodeLimits{}
	nodes, err := client.cli.CoreV1().Nodes().List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return limits, err
	}

	// accumulated node limits
	memory := int64(0)
	for _, node := range nodes.Items {
		limits.CPU += node.Status.Allocatable.Cpu().MilliValue()
		memory += node.Status.Allocatable.Memory().Value() // bytes
	}
	limits.Memory = memory / 1000000 // B to MB

	if !overCommitEnabled {
		namespaces, err := client.cli.CoreV1().Namespaces().List(context.TODO(), metav1.ListOptions{})
		if err != nil {
			return limits, err
		}

		reservedPercent := float64(resourceOverCommitPercent) / 100.0

		reserved := portainer.K8sNodeLimits{}
		for _, namespace := range namespaces.Items {
			// skip the namespace we're editing
			if namespace.Name == skipNamespace {
				continue
			}

			// minus accumulated resourcequotas for all namespaces except the one we're editing
			resourceQuota, err := client.cli.CoreV1().ResourceQuotas(namespace.Name).List(context.TODO(), metav1.ListOptions{})
			if err != nil {
				log.Debug().Msgf("error getting resourcequota for namespace %s: %s", namespace.Name, err)
				continue // skip it
			}

			for _, rq := range resourceQuota.Items {
				hardLimits := rq.Status.Hard
				for resourceType, limit := range hardLimits {
					switch resourceType {
					case "limits.cpu":
						reserved.CPU += limit.MilliValue()
					case "limits.memory":
						reserved.Memory += limit.ScaledValue(6) // MB
					}
				}
			}
		}

		limits.CPU = limits.CPU - int64(float64(limits.CPU)*reservedPercent) - reserved.CPU
		limits.Memory = limits.Memory - int64(float64(limits.Memory)*reservedPercent) - reserved.Memory
	}

	return limits, nil
}
