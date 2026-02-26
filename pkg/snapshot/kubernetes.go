package snapshot

import (
	"context"
	"errors"
	"fmt"
	"io"
	"math"
	"os"
	"reflect"
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
	statsapi "k8s.io/kubelet/pkg/apis/stats/v1alpha1"
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

	var totalCPUs, totalMemory int64
	for _, node := range nodeList.Items {
		totalCPUs += node.Status.Capacity.Cpu().Value()
		totalMemory += node.Status.Capacity.Memory().Value()
	}
	snapshot.TotalCPU = totalCPUs
	snapshot.TotalMemory = totalMemory
	snapshot.NodeCount = len(nodeList.Items)

	// Collect performance metrics if we have a real client, otherwise use zero values
	if clientset, ok := cli.(*kubernetes.Clientset); ok {
		kubernetesSnapshotPerformanceMetricsWithClient(nodeList, clientset, snapshot)
	} else {
		snapshot.PerformanceMetrics = &portainer.PerformanceMetrics{
			CPUUsage:     0,
			MemoryUsage:  0,
			NetworkUsage: 0,
		}
	}
	return nil
}

func kubernetesSnapshotPerformanceMetricsWithClient(
	nodeList *corev1.NodeList,
	cli *kubernetes.Clientset,
	snapshot *portainer.KubernetesSnapshot,
) {
	performanceMetrics := &portainer.PerformanceMetrics{
		CPUUsage:     0,
		MemoryUsage:  0,
		NetworkUsage: 0,
	}

	for _, node := range nodeList.Items {
		nodeMetrics, err := kubernetesSnapshotNodePerformanceMetrics(cli, node, nil)
		if err != nil {
			log.Warn().Err(err).Msgf("failed to snapshot performance metrics for node %s", node.Name)
			continue
		}
		if nodeMetrics != nil {
			performanceMetrics.CPUUsage += nodeMetrics.CPUUsage
			performanceMetrics.MemoryUsage += nodeMetrics.MemoryUsage
			performanceMetrics.NetworkUsage += nodeMetrics.NetworkUsage
		}
	}
	snapshot.PerformanceMetrics = performanceMetrics
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

func kubernetesSnapshotNodePerformanceMetrics(cli *kubernetes.Clientset, node corev1.Node, _ *portainer.PerformanceMetrics) (*portainer.PerformanceMetrics, error) {
	result := cli.RESTClient().Get().AbsPath(fmt.Sprintf("/api/v1/nodes/%s/proxy/stats/summary", node.Name)).Do(context.TODO())
	if result.Error() != nil {
		return nil, fmt.Errorf("failed to get node performance metrics: %w", result.Error())
	}

	raw, err := result.Raw()
	if err != nil {
		return nil, fmt.Errorf("failed to get node performance metrics: %w", err)
	}

	stats := statsapi.Summary{}
	err = json.Unmarshal(raw, &stats)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal node performance metrics: %w", err)
	}

	nodeStats := stats.Node
	metrics := calculateNodeMetrics(nodeStats, node)
	return metrics, nil
}

// calculateNodeMetrics calculates performance metrics from node stats - extracted for testability
func calculateNodeMetrics(nodeStats statsapi.NodeStats, node corev1.Node) *portainer.PerformanceMetrics {
	if reflect.DeepEqual(nodeStats, statsapi.NodeStats{}) {
		return nil
	}

	metrics := &portainer.PerformanceMetrics{}

	// Calculate CPU usage percentage
	if nodeStats.CPU != nil && nodeStats.CPU.UsageNanoCores != nil {
		totalCapacityNanoCores := node.Status.Capacity.Cpu().Value() * 1_000_000_000
		metrics.CPUUsage = math.Round(float64(*nodeStats.CPU.UsageNanoCores) / float64(totalCapacityNanoCores) * 100)
	}

	// Calculate Memory usage percentage
	if nodeStats.Memory != nil && nodeStats.Memory.WorkingSetBytes != nil {
		totalCapacityBytes := node.Status.Capacity.Memory().Value()
		metrics.MemoryUsage = math.Round(float64(*nodeStats.Memory.WorkingSetBytes) / float64(totalCapacityBytes) * 100)
	}

	// Calculate Network usage in MB
	if nodeStats.Network != nil && nodeStats.Network.RxBytes != nil && nodeStats.Network.TxBytes != nil {
		totalBytes := float64(*nodeStats.Network.RxBytes) + float64(*nodeStats.Network.TxBytes)
		const bytesToMB = 1024 * 1024
		metrics.NetworkUsage = math.Round(totalBytes / bytesToMB)
	}

	return metrics
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
