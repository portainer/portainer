package snapshot

import (
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"strings"
	"time"

	"github.com/segmentio/encoding/json"

	"github.com/aws/smithy-go/ptr"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/logs"
	edgeutils "github.com/portainer/portainer/pkg/edge"
	networkingutils "github.com/portainer/portainer/pkg/networking"
	"github.com/rs/zerolog/log"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

func CreateKubernetesSnapshot(cli *kubernetes.Clientset) (*portainer.KubernetesSnapshot, error) {
	kubernetesSnapshot := &portainer.KubernetesSnapshot{}
	err := kubernetesSnapshotVersion(kubernetesSnapshot, cli)
	if err != nil {
		log.Warn().Err(err).Msg("unable to snapshot cluster version")
	}

	err = kubernetesSnapshotNodes(kubernetesSnapshot, cli)
	if err != nil {
		log.Warn().Err(err).Msg("unable to snapshot cluster nodes")
	}

	kubernetesSnapshot.Time = time.Now().Unix()
	return kubernetesSnapshot, nil
}

func kubernetesSnapshotVersion(snapshot *portainer.KubernetesSnapshot, cli kubernetes.Interface) error {
	versionInfo, err := cli.Discovery().ServerVersion()
	if err != nil {
		return err
	}

	snapshot.KubernetesVersion = versionInfo.GitVersion
	return nil
}

func kubernetesSnapshotNodes(snapshot *portainer.KubernetesSnapshot, cli kubernetes.Interface) error {
	nodeList, err := cli.CoreV1().Nodes().List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return err
	}

	if len(nodeList.Items) == 0 {
		return nil
	}

	totalGPU := make(map[string]int64)
	var totalCPUs, totalMemory int64
	var gpuNodeCount int

	for _, node := range nodeList.Items {
		totalCPUs += node.Status.Capacity.Cpu().Value()
		totalMemory += node.Status.Capacity.Memory().Value()

		nodeHasGPU := false
		for resourceName, quantity := range node.Status.Capacity {
			if strings.HasPrefix(string(resourceName), "nvidia.com/") {
				totalGPU[string(resourceName)] += quantity.Value()
				nodeHasGPU = true
			}
		}
		if nodeHasGPU {
			gpuNodeCount++
		}
	}

	snapshot.TotalCPU = totalCPUs
	snapshot.TotalMemory = totalMemory
	snapshot.NodeCount = len(nodeList.Items)
	snapshot.ClusterType = clusterTypeFromProviderID(nodeList.Items[0].Spec.ProviderID)
	snapshot.GPUNodeCount = gpuNodeCount
	if len(totalGPU) > 0 {
		snapshot.TotalGPU = totalGPU
	}

	return nil
}

const (
	ClusterTypeGKEAutopilot = "gke-autopilot"
	ClusterTypeEKSFargate   = "eks-fargate"
	ClusterTypeAKS          = "aks"
	ClusterTypeUnknown      = ""
)

func clusterTypeFromProviderID(providerID string) string {
	switch {
	case strings.HasPrefix(providerID, "gce://") && isGKEAutopilotProviderID(providerID):
		return ClusterTypeGKEAutopilot
	case strings.HasPrefix(providerID, "aws://") && strings.Contains(strings.ToLower(providerID), "fargate"):
		return ClusterTypeEKSFargate
	case strings.HasPrefix(providerID, "azure://"):
		return ClusterTypeAKS
	default:
		return ClusterTypeUnknown
	}
}

// isGKEAutopilotProviderID detects GKE Autopilot via the gk3- node-name prefix.
// ProviderID format: gce://PROJECT/REGION/NODE-NAME
// Autopilot nodes: gk3-CLUSTER-POOL-SUFFIX; Standard nodes: gke-CLUSTER-POOL-SUFFIX
func isGKEAutopilotProviderID(providerID string) bool {
	parts := strings.Split(providerID, "/")
	return len(parts) > 0 && strings.HasPrefix(parts[len(parts)-1], "gk3-")
}

// KubernetesSnapshotDiagnostics returns the diagnostics data for the agent
func KubernetesSnapshotDiagnostics(cli *kubernetes.Clientset, edgeKey string) (*portainer.DiagnosticsData, error) {
	podID := os.Getenv("HOSTNAME")
	snapshot := &portainer.KubernetesSnapshot{
		DiagnosticsData: &portainer.DiagnosticsData{
			DNS:    make(map[string]string),
			Telnet: make(map[string]string),
		},
	}

	err := kubernetesSnapshotPodErrorLogs(snapshot, cli, "portainer", podID)
	if err != nil {
		return nil, fmt.Errorf("failed to snapshot pod error logs: %w", err)
	}

	if edgeKey != "" {
		url, err := edgeutils.GetPortainerURLFromEdgeKey(edgeKey)
		if err != nil {
			return nil, fmt.Errorf("failed to get portainer URL from edge key: %w", err)
		}

		snapshot.DiagnosticsData.DNS["edge-to-portainer"] = networkingutils.ProbeDNSConnection(url)
		snapshot.DiagnosticsData.Telnet["edge-to-portainer"] = networkingutils.ProbeTelnetConnection(url)
	}

	return snapshot.DiagnosticsData, nil
}

// KubernetesSnapshotPodErrorLogs returns 0 to 10 lines of the most recent error logs of the agent container
// this will primarily be used for agent snapshot
func kubernetesSnapshotPodErrorLogs(snapshot *portainer.KubernetesSnapshot, cli *kubernetes.Clientset, namespace, podID string) error {
	if namespace == "" || podID == "" {
		return errors.New("both namespace and podID are required to capture pod error logs in the snapshot")
	}

	logsStream, err := cli.CoreV1().Pods(namespace).GetLogs(podID, &corev1.PodLogOptions{TailLines: ptr.Int64(10), Timestamps: true}).Stream(context.TODO())
	if err != nil {
		return fmt.Errorf("failed to stream logs: %w", err)
	}
	defer logs.CloseAndLogErr(logsStream)

	logBytes, err := io.ReadAll(logsStream)
	if err != nil {
		return fmt.Errorf("failed to read error logs: %w", err)
	}

	logs := filterLogsByPattern(logBytes, []string{"error", "err", "level=error", "exception", "fatal", "panic"})

	jsonLogs, err := json.Marshal(logs)
	if err != nil {
		return fmt.Errorf("failed to marshal logs: %w", err)
	}
	snapshot.DiagnosticsData.Log = string(jsonLogs)

	return nil
}

func filterLogsByPattern(logBytes []byte, patterns []string) []map[string]string {
	logs := []map[string]string{}
	for line := range strings.SplitSeq(strings.TrimSpace(string(logBytes)), "\n") {
		if line == "" {
			continue
		}

		if parts := strings.SplitN(line, " ", 2); len(parts) == 2 {
			messageLower := strings.ToLower(parts[1])
			for _, pattern := range patterns {
				if strings.Contains(messageLower, pattern) {
					logs = append(logs, map[string]string{
						"timestamp": parts[0],
						"message":   parts[1],
					})
					break
				}
			}
		}
	}

	return logs
}
