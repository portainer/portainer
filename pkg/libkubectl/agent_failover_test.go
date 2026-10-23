package libkubectl

import (
	"bytes"
	"context"
	"errors"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	kubetesting "k8s.io/client-go/testing"

	kfake "k8s.io/client-go/kubernetes/fake"
	"k8s.io/kubectl/pkg/cmd/util"
	"k8s.io/kubectl/pkg/drain"
)

var errUnknownServerError = errors.New(`an error on the server ("unknown") has prevented the request from succeeding`)

func agentDeployment() *appsv1.Deployment {
	return &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name:      portainerAgentDeploymentName,
			Namespace: portainerAgentNamespace,
		},
		Spec: appsv1.DeploymentSpec{
			Selector: &metav1.LabelSelector{
				MatchLabels: map[string]string{"app": "portainer-agent"},
			},
		},
	}
}

func agentPod(name, nodeName string, phase corev1.PodPhase) *corev1.Pod {
	return &corev1.Pod{
		ObjectMeta: metav1.ObjectMeta{
			Name:      name,
			Namespace: portainerAgentNamespace,
			Labels:    map[string]string{"app": "portainer-agent"},
		},
		Spec: corev1.PodSpec{
			NodeName: nodeName,
		},
		Status: corev1.PodStatus{
			Phase: phase,
		},
	}
}

// testDrainer returns a *drain.Helper wired to clientset. It also registers
// a bare "v1" API resource list on the fake clientset with no eviction
// subresource, since drain.CheckEvictionSupport queries server discovery for
// "v1" and errors out if the fake clientset has no resources registered at
// all (rather than reporting "no eviction support") — this makes
// DeleteOrEvictPods fall back to plain pod deletion, as it would against a
// real, older/eviction-less cluster.
func testDrainer(clientset *kfake.Clientset) *drain.Helper {
	clientset.Resources = append(clientset.Resources, &metav1.APIResourceList{GroupVersion: "v1"})

	buf := new(bytes.Buffer)
	return &drain.Helper{
		Ctx:            context.Background(),
		Client:         clientset,
		Timeout:        30 * time.Second,
		Out:            buf,
		ErrOut:         buf,
		DryRunStrategy: util.DryRunNone,
	}
}

func TestFindAgentPodsOnNode_NoAgentDeployment(t *testing.T) {
	t.Parallel()

	clientset := kfake.NewSimpleClientset()

	pods := findAgentPodsOnNode(context.Background(), clientset, "node-1")
	require.Empty(t, pods)
}

func TestFindAgentPodsOnNode_AgentNotOnDrainedNode(t *testing.T) {
	t.Parallel()

	clientset := kfake.NewSimpleClientset(
		agentDeployment(),
		agentPod("portainer-agent-abc", "node-2", corev1.PodRunning),
	)

	pods := findAgentPodsOnNode(context.Background(), clientset, "node-1")
	require.Empty(t, pods)
}

func TestFindAgentPodsOnNode_AgentOnDrainedNode(t *testing.T) {
	t.Parallel()

	clientset := kfake.NewSimpleClientset(
		agentDeployment(),
		agentPod("portainer-agent-abc", "node-1", corev1.PodRunning),
	)

	pods := findAgentPodsOnNode(context.Background(), clientset, "node-1")
	require.Len(t, pods, 1)
	require.Equal(t, "portainer-agent-abc", pods[0].Name)
}

func TestSkipPodsFilter_SkipsMatchingPodAndKeepsOthers(t *testing.T) {
	t.Parallel()

	skip := agentPod("portainer-agent-abc", "node-1", corev1.PodRunning)
	filter := skipPodsFilter([]corev1.Pod{*skip})

	status := filter(*skip)
	require.False(t, status.Delete)
	require.Equal(t, drain.PodDeleteStatusTypeSkip, status.Reason)

	other := corev1.Pod{ObjectMeta: metav1.ObjectMeta{Name: "other-pod", Namespace: "default"}}
	otherStatus := filter(other)
	require.True(t, otherStatus.Delete)
}

// TestEvictAgentAndWaitForFailover_EvictsThenWaitsForReplacement asserts
// that evicting the agent pod is what triggers the wait to succeed, rather
// than the function passively waiting for external state it never caused.
func TestEvictAgentAndWaitForFailover_EvictsThenWaitsForReplacement(t *testing.T) {
	t.Parallel()

	clientset := kfake.NewSimpleClientset(
		agentDeployment(),
		agentPod("portainer-agent-old", "node-1", corev1.PodRunning),
	)

	clientset.PrependReactor("delete", "pods", func(action kubetesting.Action) (bool, runtime.Object, error) {
		deleteAction, ok := action.(kubetesting.DeleteAction)
		if ok && deleteAction.GetName() == "portainer-agent-old" {
			go func() {
				_, _ = clientset.CoreV1().Pods(portainerAgentNamespace).Create(
					context.Background(),
					agentPod("portainer-agent-new", "node-2", corev1.PodRunning),
					metav1.CreateOptions{},
				)
			}()
		}
		return false, nil, nil
	})

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	agentPodsOnNode := findAgentPodsOnNode(ctx, clientset, "node-1")
	require.Len(t, agentPodsOnNode, 1)

	evictAgentAndWaitForFailover(ctx, testDrainer(clientset), clientset, "node-1", agentPodsOnNode)

	_, err := clientset.CoreV1().Pods(portainerAgentNamespace).Get(context.Background(), "portainer-agent-old", metav1.GetOptions{})
	require.Error(t, err, "the original agent pod on the drained node should have been deleted")
}

// TestEvictAgentAndWaitForFailover_TimeoutIsNonFatal asserts that when no
// replacement ever appears, the function does not panic or block forever —
// it simply gives up after the bound and returns, since by the time this
// runs the rest of the node has already drained successfully and the
// agent's own fate is best-effort.
func TestEvictAgentAndWaitForFailover_TimeoutIsNonFatal(t *testing.T) {
	t.Parallel()

	clientset := kfake.NewSimpleClientset(
		agentDeployment(),
		agentPod("portainer-agent-old", "node-1", corev1.PodRunning),
	)

	ctx, cancel := context.WithTimeout(context.Background(), 3*agentFailoverInterval)
	defer cancel()

	agentPodsOnNode := findAgentPodsOnNode(ctx, clientset, "node-1")
	require.Len(t, agentPodsOnNode, 1)

	// Must return (not panic, not hang) even though no replacement appears.
	evictAgentAndWaitForFailover(ctx, testDrainer(clientset), clientset, "node-1", agentPodsOnNode)
}

// TestEvictAgentAndWaitForFailover_EvictionErrorIsNonFatal reproduces the
// live-cluster regression: evicting the agent pod can itself return an error
// (e.g. the "unknown" transient error seen when the agent pod being deleted
// is also the connection's own proxy) even though the pod is genuinely
// evicted. The function must not panic or otherwise fail hard — the caller
// (DrainNode) no longer propagates any error from this step.
func TestEvictAgentAndWaitForFailover_EvictionErrorIsNonFatal(t *testing.T) {
	t.Parallel()

	clientset := kfake.NewSimpleClientset(
		agentDeployment(),
		agentPod("portainer-agent-old", "node-1", corev1.PodRunning),
	)

	clientset.PrependReactor("delete", "pods", func(action kubetesting.Action) (bool, runtime.Object, error) {
		deleteAction, ok := action.(kubetesting.DeleteAction)
		if ok && deleteAction.GetName() == "portainer-agent-old" {
			return true, nil, errUnknownServerError
		}
		return false, nil, nil
	})

	ctx, cancel := context.WithTimeout(context.Background(), 3*agentFailoverInterval)
	defer cancel()

	agentPodsOnNode := findAgentPodsOnNode(ctx, clientset, "node-1")
	require.Len(t, agentPodsOnNode, 1)

	evictAgentAndWaitForFailover(ctx, testDrainer(clientset), clientset, "node-1", agentPodsOnNode)
}
