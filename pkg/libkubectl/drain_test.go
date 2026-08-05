package libkubectl

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	kfake "k8s.io/client-go/kubernetes/fake"
	kubetesting "k8s.io/client-go/testing"
)

func testNode(name string) *corev1.Node {
	return &corev1.Node{
		ObjectMeta: metav1.ObjectMeta{Name: name},
	}
}

// replicaSetOwnedPod returns a pod with an owner reference, so drain's
// unreplicatedFilter allows it to be drained without requiring Force.
func replicaSetOwnedPod(name, namespace, nodeName string) *corev1.Pod {
	return &corev1.Pod{
		ObjectMeta: metav1.ObjectMeta{
			Name:      name,
			Namespace: namespace,
			OwnerReferences: []metav1.OwnerReference{
				{
					APIVersion: "apps/v1",
					Kind:       "ReplicaSet",
					Name:       "some-replicaset",
					Controller: new(true),
				},
			},
		},
		Spec: corev1.PodSpec{NodeName: nodeName},
		Status: corev1.PodStatus{
			Phase: corev1.PodRunning,
		},
	}
}

// replicaSetOwnedAgentPod is agentPod (from agent_failover_test.go) with an
// owner reference added, so it survives drain's unreplicatedFilter — needed
// here since this pod goes through the real drain.RunNodeDrain filter chain.
func replicaSetOwnedAgentPod(name, nodeName string, phase corev1.PodPhase) *corev1.Pod {
	pod := agentPod(name, nodeName, phase)
	pod.OwnerReferences = []metav1.OwnerReference{
		{
			APIVersion: "apps/v1",
			Kind:       "ReplicaSet",
			Name:       "portainer-agent-replicaset",
			Controller: new(true),
		},
	}
	return pod
}

func TestDrainNodeWithClient_NoAgent_DrainsRegularPods(t *testing.T) {
	t.Parallel()

	clientset := kfake.NewSimpleClientset(
		testNode("node-1"),
		replicaSetOwnedPod("app-pod", "default", "node-1"),
	)
	clientset.Resources = append(clientset.Resources, &metav1.APIResourceList{GroupVersion: "v1"})

	opts := DefaultDrainOptions()
	opts.Timeout = 10 * time.Second

	_, err := drainNodeWithClient(context.Background(), clientset, "node-1", opts)
	require.NoError(t, err)

	_, err = clientset.CoreV1().Pods("default").Get(context.Background(), "app-pod", metav1.GetOptions{})
	require.Error(t, err, "the regular pod on the drained node should have been deleted")

	node, err := clientset.CoreV1().Nodes().Get(context.Background(), "node-1", metav1.GetOptions{})
	require.NoError(t, err)
	require.True(t, node.Spec.Unschedulable, "the node should have been cordoned")
}

// Proves drainNodeWithClient's wiring: the agent pod is skipped during the
// normal drain pass, other pods still drain, and the agent is evicted last.
func TestDrainNodeWithClient_AgentOnNode_SkipsAgentInNormalPassAndEvictsLast(t *testing.T) {
	t.Parallel()

	clientset := kfake.NewSimpleClientset(
		testNode("node-1"),
		agentDeployment(),
		replicaSetOwnedAgentPod("portainer-agent-old", "node-1", corev1.PodRunning),
		replicaSetOwnedPod("app-pod", "default", "node-1"),
	)
	clientset.Resources = append(clientset.Resources, &metav1.APIResourceList{GroupVersion: "v1"})

	opts := DefaultDrainOptions()
	opts.Timeout = 10 * time.Second

	// Simulate the ReplicaSet controller creating a replacement once the old
	// agent pod is deleted, so the poll succeeds quickly.
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

	_, err := drainNodeWithClient(ctx, clientset, "node-1", opts)
	require.NoError(t, err, "drain must succeed and observe the agent's replacement coming up on another node")

	_, err = clientset.CoreV1().Pods("default").Get(context.Background(), "app-pod", metav1.GetOptions{})
	require.Error(t, err, "the regular pod must still be drained even though the node also runs the agent")

	_, err = clientset.CoreV1().Pods(portainerAgentNamespace).Get(context.Background(), "portainer-agent-old", metav1.GetOptions{})
	require.Error(t, err, "the agent pod must eventually be evicted too, just after everything else")
}
