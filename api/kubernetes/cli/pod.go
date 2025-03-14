package cli

import (
	"context"
	"fmt"
	"strconv"
	"time"

	portainer "github.com/portainer/portainer/api"

	"github.com/pkg/errors"
	"github.com/rs/zerolog/log"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func (kcl *KubeClient) GetPods(namespace string) ([]corev1.Pod, error) {
	pods, err := kcl.cli.CoreV1().Pods(namespace).List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	return pods.Items, nil
}

// isReplicaSetOwner checks if the pod's owner reference is a ReplicaSet
func isReplicaSetOwner(pod corev1.Pod) bool {
	return len(pod.OwnerReferences) > 0 && pod.OwnerReferences[0].Kind == "ReplicaSet"
}

// updateOwnerReferenceToDeployment updates the pod's owner reference to the Deployment if applicable
func updateOwnerReferenceToDeployment(pod *corev1.Pod, replicaSets []appsv1.ReplicaSet) {
	for _, replicaSet := range replicaSets {
		if pod.OwnerReferences[0].Name == replicaSet.Name {
			if len(replicaSet.OwnerReferences) > 0 && replicaSet.OwnerReferences[0].Kind == "Deployment" {
				pod.OwnerReferences[0].Kind = "Deployment"
				pod.OwnerReferences[0].Name = replicaSet.OwnerReferences[0].Name
			}
			break
		}
	}
}

// containsStatefulSetOwnerReference checks if the pod list contains a pod with a StatefulSet owner reference
func containsStatefulSetOwnerReference(pods *corev1.PodList) bool {
	for _, pod := range pods.Items {
		if len(pod.OwnerReferences) > 0 && pod.OwnerReferences[0].Kind == "StatefulSet" {
			return true
		}
	}
	return false
}

// containsDaemonSetOwnerReference checks if the pod list contains a pod with a DaemonSet owner reference
func containsDaemonSetOwnerReference(pods *corev1.PodList) bool {
	for _, pod := range pods.Items {
		if len(pod.OwnerReferences) > 0 && pod.OwnerReferences[0].Kind == "DaemonSet" {
			return true
		}
	}
	return false
}

// containsReplicaSetOwnerReference checks if the pod list contains a pod with a ReplicaSet owner reference
func containsReplicaSetOwnerReference(pods *corev1.PodList) bool {
	for _, pod := range pods.Items {
		if len(pod.OwnerReferences) > 0 && pod.OwnerReferences[0].Kind == "ReplicaSet" {
			return true
		}
	}
	return false
}

// CreateUserShellPod will create a kubectl based shell for the specified user by mounting their respective service account.
// The lifecycle of the pod is managed in this function; this entails management of the following pod operations:
// - The shell pod will be scoped to specified service accounts access permissions
// - The shell pod will be automatically removed if it's not ready after specified period of time
// - The shell pod will be automatically removed after a specified max life (prevent zombie pods)
// - The shell pod will be automatically removed if request is cancelled (or client closes websocket connection)
func (kcl *KubeClient) CreateUserShellPod(ctx context.Context, serviceAccountName, shellPodImage string) (*portainer.KubernetesShellPod, error) {
	maxPodKeepAliveSecondsStr := strconv.Itoa(int(portainer.WebSocketKeepAlive.Seconds()))

	podPrefix := userShellPodPrefix(serviceAccountName)

	podSpec := &corev1.Pod{
		ObjectMeta: metav1.ObjectMeta{
			GenerateName: podPrefix,
			Namespace:    portainerNamespace,
			Annotations: map[string]string{
				"kubernetes.io/pod.type": "kubectl-shell",
			},
		},
		Spec: corev1.PodSpec{
			TerminationGracePeriodSeconds: new(int64),
			ServiceAccountName:            serviceAccountName,
			Containers: []corev1.Container{
				{
					Name:    "kubectl-shell-container",
					Image:   shellPodImage,
					Command: []string{"sleep"},
					// Specify sleep time to prevent zombie pods in case portainer process is terminated
					Args:            []string{maxPodKeepAliveSecondsStr},
					ImagePullPolicy: corev1.PullIfNotPresent,
				},
			},
			RestartPolicy: corev1.RestartPolicyNever,
		},
	}

	shellPod, err := kcl.cli.CoreV1().Pods(portainerNamespace).Create(context.TODO(), podSpec, metav1.CreateOptions{})
	if err != nil {
		return nil, errors.Wrap(err, "error creating shell pod")
	}

	// Wait for pod to reach ready state
	timeoutCtx, cancelFunc := context.WithTimeout(ctx, 20*time.Second)
	defer cancelFunc()

	if err := kcl.waitForPodStatus(timeoutCtx, corev1.PodRunning, shellPod); err != nil {
		kcl.cli.CoreV1().Pods(portainerNamespace).Delete(context.TODO(), shellPod.Name, metav1.DeleteOptions{})

		return nil, errors.Wrap(err, "aborting pod creation; error waiting for shell pod ready status")
	}

	podData := &portainer.KubernetesShellPod{
		Namespace:        shellPod.Namespace,
		PodName:          shellPod.Name,
		ContainerName:    shellPod.Spec.Containers[0].Name,
		ShellExecCommand: "env COLUMNS=200 /bin/bash", // env COLUMNS dictates minimum width of the shell
	}

	// Handle pod lifecycle/cleanup - terminate pod after maxPodKeepAlive or upon request (long-lived) cancellation
	go func() {
		select {
		case <-time.After(portainer.WebSocketKeepAlive):
			log.Debug().Msg("pod removal schedule duration exceeded")
			kcl.cli.CoreV1().Pods(portainerNamespace).Delete(context.TODO(), shellPod.Name, metav1.DeleteOptions{})
		case <-ctx.Done():
			err := ctx.Err()
			log.Debug().Err(err).Msg("context error")
			kcl.cli.CoreV1().Pods(portainerNamespace).Delete(context.TODO(), shellPod.Name, metav1.DeleteOptions{})
		}
	}()

	return podData, nil
}

// waitForPodStatus will wait until duration d (from now) for a pod to reach defined phase/status.
// The pod status will be polled at specified delay until the pod reaches ready state.
func (kcl *KubeClient) waitForPodStatus(ctx context.Context, phase corev1.PodPhase, pod *corev1.Pod) error {
	log.Debug().Str("pod", pod.Name).Msg("waiting for pod ready")

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
			pod, err := kcl.cli.CoreV1().Pods(pod.Namespace).Get(context.TODO(), pod.Name, metav1.GetOptions{})
			if err != nil {
				return err
			}

			if pod.Status.Phase == phase {
				return nil
			}

			time.Sleep(500 * time.Millisecond)
		}
	}
}

// fetchAllApplicationsListResources fetches all pods, replica sets, stateful sets, and daemon sets across the cluster, i.e. all namespaces
// this is required for the applications list view
func (kcl *KubeClient) fetchAllApplicationsListResources(namespace string, podListOptions metav1.ListOptions) (PortainerApplicationResources, error) {
	return kcl.fetchResourcesWithOwnerReferences(namespace, podListOptions, true, true)
}

// fetchResourcesWithOwnerReferences fetches pods and other resources based on owner references
func (kcl *KubeClient) fetchResourcesWithOwnerReferences(namespace string, podListOptions metav1.ListOptions, includeStatefulSets, includeDaemonSets bool) (PortainerApplicationResources, error) {
	pods, err := kcl.cli.CoreV1().Pods(namespace).List(context.Background(), podListOptions)
	if err != nil {
		if k8serrors.IsNotFound(err) {
			return PortainerApplicationResources{}, nil
		}
		return PortainerApplicationResources{}, fmt.Errorf("unable to list pods across the cluster: %w", err)
	}

	portainerApplicationResources := PortainerApplicationResources{
		Pods: pods.Items,
	}

	replicaSets, err := kcl.cli.AppsV1().ReplicaSets(namespace).List(context.Background(), metav1.ListOptions{})
	if err != nil && !k8serrors.IsNotFound(err) {
		return PortainerApplicationResources{}, fmt.Errorf("unable to list replica sets across the cluster: %w", err)
	}
	portainerApplicationResources.ReplicaSets = replicaSets.Items

	deployments, err := kcl.cli.AppsV1().Deployments(namespace).List(context.Background(), metav1.ListOptions{})
	if err != nil && !k8serrors.IsNotFound(err) {
		return PortainerApplicationResources{}, fmt.Errorf("unable to list deployments across the cluster: %w", err)
	}
	portainerApplicationResources.Deployments = deployments.Items

	if includeStatefulSets {
		statefulSets, err := kcl.cli.AppsV1().StatefulSets(namespace).List(context.Background(), metav1.ListOptions{})
		if err != nil && !k8serrors.IsNotFound(err) {
			return PortainerApplicationResources{}, fmt.Errorf("unable to list stateful sets across the cluster: %w", err)
		}
		portainerApplicationResources.StatefulSets = statefulSets.Items
	}

	if includeDaemonSets {
		daemonSets, err := kcl.cli.AppsV1().DaemonSets(namespace).List(context.Background(), metav1.ListOptions{})
		if err != nil && !k8serrors.IsNotFound(err) {
			return PortainerApplicationResources{}, fmt.Errorf("unable to list daemon sets across the cluster: %w", err)
		}
		portainerApplicationResources.DaemonSets = daemonSets.Items
	}

	services, err := kcl.cli.CoreV1().Services(namespace).List(context.Background(), metav1.ListOptions{})
	if err != nil && !k8serrors.IsNotFound(err) {
		return PortainerApplicationResources{}, fmt.Errorf("unable to list services across the cluster: %w", err)
	}
	portainerApplicationResources.Services = services.Items

	hpas, err := kcl.cli.AutoscalingV2().HorizontalPodAutoscalers(namespace).List(context.Background(), metav1.ListOptions{})
	if err != nil && !k8serrors.IsNotFound(err) {
		return PortainerApplicationResources{}, fmt.Errorf("unable to list horizontal pod autoscalers across the cluster: %w", err)
	}
	portainerApplicationResources.HorizontalPodAutoscalers = hpas.Items

	return portainerApplicationResources, nil
}

// isPodUsingConfigMap checks if a pod is using a specific ConfigMap
func isPodUsingConfigMap(pod *corev1.Pod, configMapName string) bool {
	for _, volume := range pod.Spec.Volumes {
		if volume.ConfigMap != nil && volume.ConfigMap.Name == configMapName {
			return true
		}
	}

	for _, container := range pod.Spec.Containers {
		for _, env := range container.Env {
			if env.ValueFrom != nil && env.ValueFrom.ConfigMapKeyRef != nil && env.ValueFrom.ConfigMapKeyRef.Name == configMapName {
				return true
			}
		}
	}

	return false
}

// isPodUsingSecret checks if a pod is using a specific Secret
func isPodUsingSecret(pod *corev1.Pod, secretName string) bool {
	for _, volume := range pod.Spec.Volumes {
		if volume.Secret != nil && volume.Secret.SecretName == secretName {
			return true
		}
	}

	for _, container := range pod.Spec.Containers {
		for _, env := range container.Env {
			if env.ValueFrom != nil && env.ValueFrom.SecretKeyRef != nil && env.ValueFrom.SecretKeyRef.Name == secretName {
				return true
			}
		}
	}

	return false
}

// getLatestJobPod returns the pods that are owned by a job
// it returns an error if there is an error fetching the pods
func (kcl *KubeClient) getLatestJobPod(namespace string, jobName string) (*corev1.Pod, error) {
	pods, err := kcl.cli.CoreV1().Pods(namespace).List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	for _, pod := range pods.Items {
		for _, owner := range pod.OwnerReferences {
			if owner.Kind == "Job" && owner.Name == jobName {
				return &pod, nil
			}
		}
	}

	return nil, nil
}
