package libkubectl

import (
	"context"
	"time"

	"github.com/rs/zerolog/log"
	corev1 "k8s.io/api/core/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/wait"
	"k8s.io/client-go/kubernetes"
	"k8s.io/kubectl/pkg/drain"
)

const (
	// Namespace and Deployment name used by Portainer's default Kubernetes
	// agent manifests. Custom installs using different values won't be
	// detected, and the drain proceeds with no special agent handling.
	portainerAgentNamespace      = "portainer"
	portainerAgentDeploymentName = "portainer-agent"

	// How often to poll for a replacement agent pod.
	agentFailoverInterval = 2 * time.Second

	// How long to wait for a replacement agent pod before giving up.
	agentFailoverTimeout = 3 * time.Minute
)

// findAgentPodsOnNode returns the Portainer agent's pods that are scheduled
// on nodeName. Returns nil if the agent Deployment isn't found or its pods
// can't be listed — callers treat that as "nothing special to do" rather
// than fail the drain over this best-effort heuristic.
func findAgentPodsOnNode(ctx context.Context, clientset kubernetes.Interface, nodeName string) []corev1.Pod {
	deployment, err := clientset.AppsV1().Deployments(portainerAgentNamespace).Get(ctx, portainerAgentDeploymentName, metav1.GetOptions{})
	if k8serrors.IsNotFound(err) {
		return nil
	}
	if err != nil {
		log.Warn().
			Str("context", "libkubectl").
			Str("node_name", nodeName).
			Err(err).
			Msg("Unable to check for a Portainer agent deployment before draining; proceeding without special agent handling")
		return nil
	}

	selector, err := metav1.LabelSelectorAsSelector(deployment.Spec.Selector)
	if err != nil {
		log.Warn().
			Str("context", "libkubectl").
			Str("node_name", nodeName).
			Err(err).
			Msg("Unable to parse the Portainer agent deployment's selector; proceeding without special agent handling")
		return nil
	}

	agentPods, err := clientset.CoreV1().Pods(portainerAgentNamespace).List(ctx, metav1.ListOptions{
		LabelSelector: selector.String(),
	})
	if err != nil {
		log.Warn().
			Str("context", "libkubectl").
			Str("node_name", nodeName).
			Err(err).
			Msg("Unable to list Portainer agent pods before draining; proceeding without special agent handling")
		return nil
	}

	return podsOnNode(agentPods.Items, nodeName)
}

// skipPodsFilter returns a drain.PodFilter that excludes the given pods
// (matched by namespace+name) from a drain.Helper's normal pod-deletion
// pass, so they can be handled separately.
//
// Note: drain.Helper runs its own base filters before AdditionalFilters like
// this one, and stops at the first rejection. A pod that fails a base filter
// (e.g. unreplicatedFilter, for a pod with no controller) would fail the
// drain before ever reaching this filter. A real portainer-agent pod is
// always owned by a ReplicaSet, so this doesn't happen in practice.
func skipPodsFilter(pods []corev1.Pod) drain.PodFilter {
	skip := make(map[string]bool, len(pods))
	for _, pod := range pods {
		skip[pod.Namespace+"/"+pod.Name] = true
	}

	return func(pod corev1.Pod) drain.PodDeleteStatus {
		if skip[pod.Namespace+"/"+pod.Name] {
			return drain.MakePodDeleteStatusSkip()
		}

		return drain.MakePodDeleteStatusOkay()
	}
}

// evictAgentAndWaitForFailover evicts the given Portainer agent pods
// (expected to already be excluded from the node's normal drain pass via
// skipPodsFilter) and waits for a replacement to become Running elsewhere.
//
// Errors here are logged as warnings rather than returned: evicting the
// agent pod can disrupt the very connection used to confirm that eviction,
// which can look like a failure even when the eviction succeeded. Since this
// runs after the rest of the node has already drained successfully, it's not
// worth failing the overall drain over.
func evictAgentAndWaitForFailover(ctx context.Context, drainer *drain.Helper, clientset kubernetes.Interface, nodeName string, agentPodsOnNode []corev1.Pod) {
	if len(agentPodsOnNode) == 0 {
		return
	}

	log.Info().
		Str("context", "libkubectl").
		Str("node_name", nodeName).
		Msg("Evicting the Portainer agent pod on the drained node and waiting for a replacement on another node")

	if err := drainer.DeleteOrEvictPods(agentPodsOnNode); err != nil {
		log.Warn().
			Str("context", "libkubectl").
			Str("node_name", nodeName).
			Err(err).
			Msg("Evicting the portainer-agent pod reported an error; it may still have been evicted successfully despite the error")
	}

	err := wait.PollUntilContextTimeout(ctx, agentFailoverInterval, agentFailoverTimeout, true, func(ctx context.Context) (bool, error) {
		selector, err := clientset.AppsV1().Deployments(portainerAgentNamespace).Get(ctx, portainerAgentDeploymentName, metav1.GetOptions{})
		if err != nil {
			return false, nil
		}

		labelSelector, err := metav1.LabelSelectorAsSelector(selector.Spec.Selector)
		if err != nil {
			return false, nil
		}

		pods, err := clientset.CoreV1().Pods(portainerAgentNamespace).List(ctx, metav1.ListOptions{
			LabelSelector: labelSelector.String(),
		})
		if err != nil {
			return false, nil
		}

		for _, pod := range pods.Items {
			if pod.Spec.NodeName != nodeName && pod.Spec.NodeName != "" && pod.Status.Phase == corev1.PodRunning {
				return true, nil
			}
		}

		return false, nil
	})
	if err != nil {
		log.Warn().
			Str("context", "libkubectl").
			Str("node_name", nodeName).
			Err(err).
			Msg("Timed out waiting for a new portainer-agent instance to start on another node; the node has otherwise been drained successfully")
		return
	}

	log.Info().
		Str("context", "libkubectl").
		Str("node_name", nodeName).
		Msg("Replacement Portainer agent pod is running on another node")
}

// podsOnNode returns the subset of pods scheduled on nodeName.
func podsOnNode(pods []corev1.Pod, nodeName string) []corev1.Pod {
	var onNode []corev1.Pod
	for _, pod := range pods {
		if pod.Spec.NodeName == nodeName {
			onNode = append(onNode, pod)
		}
	}

	return onNode
}
