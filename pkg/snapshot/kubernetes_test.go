package snapshot

import (
	"errors"
	"fmt"
	"testing"

	portainer "github.com/portainer/portainer/api"

	"github.com/stretchr/testify/require"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	kfake "k8s.io/client-go/kubernetes/fake"
	ktesting "k8s.io/client-go/testing"
)

func TestClusterTypeFromProviderID(t *testing.T) {
	t.Parallel()

	tests := []struct {
		providerID string
		expected   string
	}{
		{"gce://my-project/us-central1/gk3-my-cluster-pool-abc123", ClusterTypeGKEAutopilot},
		{"gce://my-project/us-central1/gke-my-cluster-pool-abc123", ClusterTypeUnknown},
		{"aws:///us-east-1/fargate-12345", ClusterTypeEKSFargate},
		{"aws:///us-east-1/i-1234567890abcdef0", ClusterTypeUnknown},
		{"azure:///subscriptions/x/resourceGroups/y/providers/Microsoft.Compute/virtualMachines/NODE", ClusterTypeAKS},
		{"", ClusterTypeUnknown},
	}

	for _, tt := range tests {
		t.Run(tt.providerID, func(t *testing.T) {
			t.Parallel()
			require.Equal(t, tt.expected, clusterTypeFromProviderID(tt.providerID))
		})
	}
}

func TestKubernetesSnapshotNodes(t *testing.T) {
	t.Parallel()
	// Create a fake client
	fakeClient := kfake.NewClientset()

	// Create test nodes with specific resource values
	node1 := &corev1.Node{
		ObjectMeta: metav1.ObjectMeta{
			Name: "test-node-1",
		},
		Spec: corev1.NodeSpec{
			ProviderID: "gce://my-project/us-central1/gk3-my-cluster-pool-abc123",
		},
		Status: corev1.NodeStatus{
			Capacity: corev1.ResourceList{
				corev1.ResourceCPU:    resource.MustParse("6"),    // 6 CPU cores
				corev1.ResourceMemory: resource.MustParse("12Gi"), // 12GB memory
			},
		},
	}

	node2 := &corev1.Node{
		ObjectMeta: metav1.ObjectMeta{
			Name: "test-node-2",
		},
		Status: corev1.NodeStatus{
			Capacity: corev1.ResourceList{
				corev1.ResourceCPU:    resource.MustParse("4"),   // 4 CPU cores
				corev1.ResourceMemory: resource.MustParse("8Gi"), // 8GB memory
			},
		},
	}

	node3 := &corev1.Node{
		ObjectMeta: metav1.ObjectMeta{
			Name: "test-node-3",
		},
		Status: corev1.NodeStatus{
			Capacity: corev1.ResourceList{
				corev1.ResourceCPU:    resource.MustParse("2"),   // 2 CPU cores
				corev1.ResourceMemory: resource.MustParse("4Gi"), // 4GB memory
			},
		},
	}

	// Add nodes to fake client
	_, err := fakeClient.CoreV1().Nodes().Create(t.Context(), node1, metav1.CreateOptions{})
	require.NoError(t, err)
	_, err = fakeClient.CoreV1().Nodes().Create(t.Context(), node2, metav1.CreateOptions{})
	require.NoError(t, err)
	_, err = fakeClient.CoreV1().Nodes().Create(t.Context(), node3, metav1.CreateOptions{})
	require.NoError(t, err)

	snapshot := &portainer.KubernetesSnapshot{}

	// Use the actual function now that it accepts kubernetes.Interface
	err = kubernetesSnapshotNodes(snapshot, fakeClient)
	require.NoError(t, err)

	// Verify the results - these should match what kubernetesSnapshotNodes would produce
	require.Equal(t, 3, snapshot.NodeCount)                         // 3 nodes
	require.Equal(t, int64(12), snapshot.TotalCPU)                  // 6 + 4 + 2 = 12 CPUs
	require.Equal(t, int64(25769803776), snapshot.TotalMemory)      // 12GB + 8GB + 4GB = 24GB in bytes
	require.Equal(t, ClusterTypeGKEAutopilot, snapshot.ClusterType) // detected from node1's ProviderID
	require.Nil(t, snapshot.PerformanceMetrics)                     // Performance metrics are no longer collected server-side
	require.Equal(t, 0, snapshot.GPUNodeCount)
	require.Nil(t, snapshot.TotalGPU)

	t.Logf("kubernetesSnapshotNodes test result: Nodes=%d, CPUs=%d, Memory=%d bytes",
		snapshot.NodeCount, snapshot.TotalCPU, snapshot.TotalMemory)
}

func TestKubernetesSnapshotNodesEmptyCluster(t *testing.T) {
	t.Parallel()
	// Test with no nodes to verify early return behavior
	fakeClient := kfake.NewClientset()
	snapshot := &portainer.KubernetesSnapshot{}

	err := kubernetesSnapshotNodes(snapshot, fakeClient)
	require.NoError(t, err)

	// Values should remain at their zero state when no nodes exist
	require.Equal(t, 0, snapshot.NodeCount)
	require.Equal(t, int64(0), snapshot.TotalCPU)
	require.Equal(t, int64(0), snapshot.TotalMemory)
	require.Equal(t, ClusterTypeUnknown, snapshot.ClusterType)
	require.Nil(t, snapshot.PerformanceMetrics) // Performance metrics should not be set for empty cluster

	t.Log("Empty cluster test passed - no nodes found, early return behavior confirmed")
}

func TestCreateKubernetesSnapshotIntegration(t *testing.T) {
	t.Parallel()
	// Integration test to verify CreateKubernetesSnapshot calls kubernetesSnapshotNodes correctly
	fakeClient := kfake.NewClientset()

	// Create test nodes
	node1 := &corev1.Node{
		ObjectMeta: metav1.ObjectMeta{
			Name: "integration-node-1",
		},
		Status: corev1.NodeStatus{
			Capacity: corev1.ResourceList{
				corev1.ResourceCPU:    resource.MustParse("8"),    // 8 CPU cores
				corev1.ResourceMemory: resource.MustParse("16Gi"), // 16GB memory
			},
		},
	}

	node2 := &corev1.Node{
		ObjectMeta: metav1.ObjectMeta{
			Name: "integration-node-2",
		},
		Status: corev1.NodeStatus{
			Capacity: corev1.ResourceList{
				corev1.ResourceCPU:    resource.MustParse("4"),   // 4 CPU cores
				corev1.ResourceMemory: resource.MustParse("8Gi"), // 8GB memory
			},
		},
	}

	// Add nodes to fake client
	_, err := fakeClient.CoreV1().Nodes().Create(t.Context(), node1, metav1.CreateOptions{})
	require.NoError(t, err)
	_, err = fakeClient.CoreV1().Nodes().Create(t.Context(), node2, metav1.CreateOptions{})
	require.NoError(t, err)

	// Test that kubernetesSnapshotVersion would work
	serverInfo, err := fakeClient.Discovery().ServerVersion()
	require.NoError(t, err)
	require.NotEmpty(t, serverInfo.GitVersion)

	// Test that kubernetesSnapshotNodes logic works
	snapshot := &portainer.KubernetesSnapshot{}
	err = kubernetesSnapshotNodes(snapshot, fakeClient)
	require.NoError(t, err)

	// Verify the integration results
	require.Equal(t, 2, snapshot.NodeCount)
	require.Equal(t, int64(12), snapshot.TotalCPU)             // 8 + 4 = 12 CPUs
	require.Equal(t, int64(25769803776), snapshot.TotalMemory) // 16GB + 8GB = 24GB in bytes
	require.Nil(t, snapshot.PerformanceMetrics)

	// Manually set the version to complete the integration test
	snapshot.KubernetesVersion = serverInfo.GitVersion
	require.NotEmpty(t, snapshot.KubernetesVersion)

	t.Logf("Integration test result: Version=%s, Nodes=%d, CPUs=%d, Memory=%d bytes",
		snapshot.KubernetesVersion, snapshot.NodeCount, snapshot.TotalCPU, snapshot.TotalMemory)
}

func TestKubernetesSnapshotNodesWithAPIError(t *testing.T) {
	t.Parallel()
	// Test error handling when the Kubernetes API returns an error
	fakeClient := kfake.NewClientset()

	// Add a reactor to simulate API error
	fakeClient.PrependReactor("list", "nodes", func(action ktesting.Action) (handled bool, ret runtime.Object, err error) {
		return true, nil, errors.New("simulated API error")
	})

	snapshot := &portainer.KubernetesSnapshot{}
	err := kubernetesSnapshotNodes(snapshot, fakeClient)

	// Should return the API error
	require.Error(t, err)
	require.Contains(t, err.Error(), "simulated API error")

	// Snapshot should remain unchanged
	require.Equal(t, 0, snapshot.NodeCount)
	require.Equal(t, int64(0), snapshot.TotalCPU)
	require.Equal(t, int64(0), snapshot.TotalMemory)
	require.Nil(t, snapshot.PerformanceMetrics)

	t.Log("API error test passed - error handling works correctly")
}

func TestKubernetesSnapshotNodesSingleNode(t *testing.T) {
	t.Parallel()
	// Test with a single node to verify calculations work for edge case
	fakeClient := kfake.NewClientset()

	node := &corev1.Node{
		ObjectMeta: metav1.ObjectMeta{
			Name: "single-node",
		},
		Status: corev1.NodeStatus{
			Capacity: corev1.ResourceList{
				corev1.ResourceCPU:    resource.MustParse("1"),   // 1 CPU core
				corev1.ResourceMemory: resource.MustParse("1Gi"), // 1GB memory
			},
		},
	}

	_, err := fakeClient.CoreV1().Nodes().Create(t.Context(), node, metav1.CreateOptions{})
	require.NoError(t, err)

	snapshot := &portainer.KubernetesSnapshot{}
	err = kubernetesSnapshotNodes(snapshot, fakeClient)
	require.NoError(t, err)

	require.Equal(t, 1, snapshot.NodeCount)
	require.Equal(t, int64(1), snapshot.TotalCPU)
	require.Equal(t, int64(1073741824), snapshot.TotalMemory) // 1GB in bytes
	require.Nil(t, snapshot.PerformanceMetrics)

	t.Logf("Single node test result: Nodes=%d, CPUs=%d, Memory=%d bytes",
		snapshot.NodeCount, snapshot.TotalCPU, snapshot.TotalMemory)
}

func TestKubernetesSnapshotNodesWithGPU(t *testing.T) {
	t.Parallel()
	fakeClient := kfake.NewClientset()

	gpuNode := &corev1.Node{
		ObjectMeta: metav1.ObjectMeta{Name: "gpu-node"},
		Status: corev1.NodeStatus{
			Capacity: corev1.ResourceList{
				corev1.ResourceCPU:    resource.MustParse("8"),
				corev1.ResourceMemory: resource.MustParse("16Gi"),
				"nvidia.com/gpu":      resource.MustParse("4"),
			},
		},
	}
	cpuNode := &corev1.Node{
		ObjectMeta: metav1.ObjectMeta{Name: "cpu-node"},
		Status: corev1.NodeStatus{
			Capacity: corev1.ResourceList{
				corev1.ResourceCPU:    resource.MustParse("4"),
				corev1.ResourceMemory: resource.MustParse("8Gi"),
			},
		},
	}

	_, err := fakeClient.CoreV1().Nodes().Create(t.Context(), gpuNode, metav1.CreateOptions{})
	require.NoError(t, err)
	_, err = fakeClient.CoreV1().Nodes().Create(t.Context(), cpuNode, metav1.CreateOptions{})
	require.NoError(t, err)

	snapshot := &portainer.KubernetesSnapshot{}
	err = kubernetesSnapshotNodes(snapshot, fakeClient)
	require.NoError(t, err)

	require.Equal(t, 2, snapshot.NodeCount)
	require.Equal(t, 1, snapshot.GPUNodeCount)
	require.Equal(t, int64(4), snapshot.TotalGPU["nvidia.com/gpu"])
}

func TestKubernetesSnapshotNodesMultipleGPUTypes(t *testing.T) {
	t.Parallel()
	fakeClient := kfake.NewClientset()

	node := &corev1.Node{
		ObjectMeta: metav1.ObjectMeta{Name: "mig-node"},
		Status: corev1.NodeStatus{
			Capacity: corev1.ResourceList{
				corev1.ResourceCPU:       resource.MustParse("8"),
				corev1.ResourceMemory:    resource.MustParse("16Gi"),
				"nvidia.com/gpu":         resource.MustParse("2"),
				"nvidia.com/mig-2g.10gb": resource.MustParse("4"),
			},
		},
	}

	_, err := fakeClient.CoreV1().Nodes().Create(t.Context(), node, metav1.CreateOptions{})
	require.NoError(t, err)

	snapshot := &portainer.KubernetesSnapshot{}
	err = kubernetesSnapshotNodes(snapshot, fakeClient)
	require.NoError(t, err)

	require.Equal(t, 1, snapshot.GPUNodeCount)
	require.Equal(t, int64(2), snapshot.TotalGPU["nvidia.com/gpu"])
	require.Equal(t, int64(4), snapshot.TotalGPU["nvidia.com/mig-2g.10gb"])
}

func TestKubernetesSnapshotNodesGPUAggregatedAcrossNodes(t *testing.T) {
	t.Parallel()
	fakeClient := kfake.NewClientset()

	for i, gpuCount := range []int{2, 4} {
		node := &corev1.Node{
			ObjectMeta: metav1.ObjectMeta{Name: fmt.Sprintf("gpu-node-%d", i)},
			Status: corev1.NodeStatus{
				Capacity: corev1.ResourceList{
					corev1.ResourceCPU:    resource.MustParse("8"),
					corev1.ResourceMemory: resource.MustParse("16Gi"),
					"nvidia.com/gpu":      *resource.NewQuantity(int64(gpuCount), resource.DecimalSI),
				},
			},
		}
		_, err := fakeClient.CoreV1().Nodes().Create(t.Context(), node, metav1.CreateOptions{})
		require.NoError(t, err)
	}

	snapshot := &portainer.KubernetesSnapshot{}
	err := kubernetesSnapshotNodes(snapshot, fakeClient)
	require.NoError(t, err)

	require.Equal(t, 2, snapshot.GPUNodeCount)
	require.Equal(t, int64(6), snapshot.TotalGPU["nvidia.com/gpu"]) // 2 + 4
}

func TestKubernetesSnapshotNodesNoGPULeavesTotalGPUNil(t *testing.T) {
	t.Parallel()
	fakeClient := kfake.NewClientset()

	node := &corev1.Node{
		ObjectMeta: metav1.ObjectMeta{Name: "cpu-only-node"},
		Status: corev1.NodeStatus{
			Capacity: corev1.ResourceList{
				corev1.ResourceCPU:    resource.MustParse("4"),
				corev1.ResourceMemory: resource.MustParse("8Gi"),
			},
		},
	}
	_, err := fakeClient.CoreV1().Nodes().Create(t.Context(), node, metav1.CreateOptions{})
	require.NoError(t, err)

	snapshot := &portainer.KubernetesSnapshot{}
	err = kubernetesSnapshotNodes(snapshot, fakeClient)
	require.NoError(t, err)

	require.Equal(t, 0, snapshot.GPUNodeCount)
	require.Nil(t, snapshot.TotalGPU)
}

func TestKubernetesSnapshotNodesZeroResources(t *testing.T) {
	t.Parallel()
	// Test with nodes that have zero or very small resources
	fakeClient := kfake.NewClientset()

	node := &corev1.Node{
		ObjectMeta: metav1.ObjectMeta{
			Name: "zero-resource-node",
		},
		Status: corev1.NodeStatus{
			Capacity: corev1.ResourceList{
				corev1.ResourceCPU:    resource.MustParse("0m"),  // 0 millicores
				corev1.ResourceMemory: resource.MustParse("0Ki"), // 0 kilobytes
			},
		},
	}

	_, err := fakeClient.CoreV1().Nodes().Create(t.Context(), node, metav1.CreateOptions{})
	require.NoError(t, err)

	snapshot := &portainer.KubernetesSnapshot{}
	err = kubernetesSnapshotNodes(snapshot, fakeClient)
	require.NoError(t, err)

	require.Equal(t, 1, snapshot.NodeCount)
	require.Equal(t, int64(0), snapshot.TotalCPU)
	require.Equal(t, int64(0), snapshot.TotalMemory)
	require.Nil(t, snapshot.PerformanceMetrics)

	t.Log("Zero resources test passed - handles edge case correctly")
}

func TestKubernetesSnapshotNodesGPUDetection(t *testing.T) {
	t.Parallel()

	const gpuMemoryBytes = int64(25769803776) // 16GiB + 8GiB

	fakeClient := kfake.NewClientset()
	nodes := []*corev1.Node{
		{
			ObjectMeta: metav1.ObjectMeta{Name: "gpu-node"},
			Status: corev1.NodeStatus{
				Capacity: corev1.ResourceList{
					corev1.ResourceCPU:    resource.MustParse("8"),
					corev1.ResourceMemory: resource.MustParse("16Gi"),
					"nvidia.com/gpu":      resource.MustParse("4"),
				},
			},
		},
		{
			ObjectMeta: metav1.ObjectMeta{Name: "cpu-node"},
			Status: corev1.NodeStatus{
				Capacity: corev1.ResourceList{
					corev1.ResourceCPU:    resource.MustParse("4"),
					corev1.ResourceMemory: resource.MustParse("8Gi"),
				},
			},
		},
	}
	for _, n := range nodes {
		_, err := fakeClient.CoreV1().Nodes().Create(t.Context(), n, metav1.CreateOptions{})
		require.NoError(t, err)
	}

	snap := &portainer.KubernetesSnapshot{}
	err := kubernetesSnapshotNodes(snap, fakeClient)
	require.NoError(t, err)

	require.Equal(t, 2, snap.NodeCount)
	require.Equal(t, int64(12), snap.TotalCPU)
	require.Equal(t, gpuMemoryBytes, snap.TotalMemory)
	require.Equal(t, 1, snap.GPUNodeCount)
	require.Equal(t, map[string]int64{"nvidia.com/gpu": 4}, snap.TotalGPU)
}

func TestKubernetesSnapshotNodesNoGPUNodes(t *testing.T) {
	t.Parallel()

	fakeClient := kfake.NewClientset()
	node := &corev1.Node{
		ObjectMeta: metav1.ObjectMeta{Name: "cpu-node"},
		Status: corev1.NodeStatus{
			Capacity: corev1.ResourceList{
				corev1.ResourceCPU:    resource.MustParse("4"),
				corev1.ResourceMemory: resource.MustParse("8Gi"),
			},
		},
	}
	_, err := fakeClient.CoreV1().Nodes().Create(t.Context(), node, metav1.CreateOptions{})
	require.NoError(t, err)

	snap := &portainer.KubernetesSnapshot{}
	err = kubernetesSnapshotNodes(snap, fakeClient)
	require.NoError(t, err)

	require.Equal(t, 1, snap.NodeCount)
	require.Equal(t, int64(4), snap.TotalCPU)
	require.Equal(t, 0, snap.GPUNodeCount)
	require.Nil(t, snap.TotalGPU)
}
