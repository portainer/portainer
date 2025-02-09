package snapshot

import (
	"context"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/stretchr/testify/require"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	kfake "k8s.io/client-go/kubernetes/fake"
)

func TestCreateKubernetesSnapshot(t *testing.T) {
	cli := kfake.NewSimpleClientset()
	kubernetesSnapshot := &portainer.KubernetesSnapshot{}

	serverInfo, err := cli.Discovery().ServerVersion()
	if err != nil {
		t.Fatalf("error getting the kubernetesserver version: %v", err)
	}

	kubernetesSnapshot.KubernetesVersion = serverInfo.GitVersion
	require.Equal(t, kubernetesSnapshot.KubernetesVersion, serverInfo.GitVersion)

	nodeList, err := cli.CoreV1().Nodes().List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		t.Fatalf("error listing kubernetes nodes: %v", err)
	}

	var totalCPUs, totalMemory int64
	for _, node := range nodeList.Items {
		totalCPUs += node.Status.Capacity.Cpu().Value()
		totalMemory += node.Status.Capacity.Memory().Value()
	}

	kubernetesSnapshot.TotalCPU = totalCPUs
	kubernetesSnapshot.TotalMemory = totalMemory
	kubernetesSnapshot.NodeCount = len(nodeList.Items)
	require.Equal(t, kubernetesSnapshot.TotalCPU, totalCPUs)
	require.Equal(t, kubernetesSnapshot.TotalMemory, totalMemory)
	require.Equal(t, kubernetesSnapshot.NodeCount, len(nodeList.Items))

	t.Logf("Kubernetes snapshot: %+v", kubernetesSnapshot)
}
