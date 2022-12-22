package cli

import (
	"context"
	"fmt"
	"time"

	portainer "github.com/portainer/portainer/api"

	"github.com/pkg/errors"
	"github.com/rs/zerolog/log"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// CreateUserShellPod will create a kubectl based shell for the specified user by mounting their respective service account.
// The lifecycle of the pod is managed in this function; this entails management of the following pod operations:
// - The shell pod will be scoped to specified service accounts access permissions
// - The shell pod will be automatically removed if it's not ready after specified period of time
// - The shell pod will be automatically removed after a specified max life (prevent zombie pods)
// - The shell pod will be automatically removed if request is cancelled (or client closes websocket connection)
func (kcl *KubeClient) CreateUserShellPod(ctx context.Context, serviceAccountName, shellPodImage string) (*portainer.KubernetesShellPod, error) {
	maxPodKeepAliveSecondsStr := fmt.Sprintf("%d", int(portainer.WebSocketKeepAlive.Seconds()))

	podPrefix := userShellPodPrefix(serviceAccountName)

	podSpec := &v1.Pod{
		ObjectMeta: metav1.ObjectMeta{
			GenerateName: podPrefix,
			Namespace:    portainerNamespace,
			Annotations: map[string]string{
				"kubernetes.io/pod.type": "kubectl-shell",
			},
		},
		Spec: v1.PodSpec{
			TerminationGracePeriodSeconds: new(int64),
			ServiceAccountName:            serviceAccountName,
			Containers: []v1.Container{
				{
					Name:    "kubectl-shell-container",
					Image:   shellPodImage,
					Command: []string{"sleep"},
					// Specify sleep time to prevent zombie pods in case portainer process is terminated
					Args:            []string{maxPodKeepAliveSecondsStr},
					ImagePullPolicy: v1.PullIfNotPresent,
				},
			},
			RestartPolicy: v1.RestartPolicyNever,
		},
	}

	shellPod, err := kcl.cli.CoreV1().Pods(portainerNamespace).Create(ctx, podSpec, metav1.CreateOptions{})
	if err != nil {
		return nil, errors.Wrap(err, "error creating shell pod")
	}

	// Wait for pod to reach ready state
	timeoutCtx, cancelFunc := context.WithTimeout(ctx, 20*time.Second)
	defer cancelFunc()
	err = kcl.waitForPodStatus(timeoutCtx, v1.PodRunning, shellPod)
	if err != nil {
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
func (kcl *KubeClient) waitForPodStatus(ctx context.Context, phase v1.PodPhase, pod *v1.Pod) error {
	log.Debug().Str("pod", pod.Name).Msg("waiting for pod ready")

	pollDelay := 500 * time.Millisecond
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
			pod, err := kcl.cli.CoreV1().Pods(pod.Namespace).Get(ctx, pod.Name, metav1.GetOptions{})
			if err != nil {
				return err
			}

			if pod.Status.Phase == phase {
				return nil
			}

			<-time.After(pollDelay)
		}
	}
}
