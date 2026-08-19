package libkubectl

import (
	"bytes"
	"context"
	"fmt"
	"time"

	"github.com/rs/zerolog/log"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/kubectl/pkg/cmd/util"
	"k8s.io/kubectl/pkg/drain"
)

// DrainOptions controls the behaviour of a node drain operation, mirroring the
// flags exposed by "kubectl drain".
type DrainOptions struct {
	// Force allows deletion of standalone pods not managed by a controller.
	Force bool
	// Timeout is the overall time to wait for the drain to complete.
	Timeout time.Duration
	// GracePeriodSeconds overrides each pod's termination grace period. -1 uses
	// the pod's own grace period.
	GracePeriodSeconds int
	// IgnoreAllDaemonSets skips DaemonSet-managed pods, which would otherwise
	// block the drain since they are recreated by their controller.
	IgnoreAllDaemonSets bool
	// DeleteEmptyDirData allows eviction of pods using emptyDir volumes, whose
	// data is lost once the pod is deleted.
	DeleteEmptyDirData bool
	// DisableEviction forces the use of direct pod deletion instead of the
	// eviction API, ignoring any configured PodDisruptionBudgets.
	DisableEviction bool
}

// DefaultDrainOptions returns the defaults applied when a caller omits the
// drain request payload.
func DefaultDrainOptions() DrainOptions {
	return DrainOptions{
		Force:               false,
		GracePeriodSeconds:  -1,
		IgnoreAllDaemonSets: true,
		Timeout:             60 * time.Second,
		DeleteEmptyDirData:  true,
		DisableEviction:     false,
	}
}

// DrainNode drains a node from the cluster
func (c *Client) DrainNode(nodeName string, opts DrainOptions) (string, error) {
	log.Debug().
		Str("context", "libkubectl").
		Str("node_name", nodeName).
		Msg("Starting node drain operation")

	// Get clientset from factory
	clientset, err := c.factory.KubernetesClientSet()
	if err != nil {
		log.Error().
			Str("context", "libkubectl").
			Str("node_name", nodeName).
			Err(err).
			Msg("Failed to get kubernetes clientset for node drain")
		return "", fmt.Errorf("failed to get kubernetes clientset for node drain: %w", err)
	}

	log.Debug().
		Str("context", "libkubectl").
		Str("node_name", nodeName).
		Msg("Successfully obtained kubernetes clientset")

	return drainNodeWithClient(context.Background(), clientset, nodeName, opts)
}

// drainNodeWithClient runs the cordon-drain-agent-failover sequence against
// an already-resolved clientset. Split out from DrainNode so it can be
// unit-tested with a fake clientset, since KubernetesClientSet() returns a
// concrete type that can't be faked directly.
func drainNodeWithClient(ctx context.Context, clientset kubernetes.Interface, nodeName string, opts DrainOptions) (string, error) {
	buf := new(bytes.Buffer)

	drainer := &drain.Helper{
		Ctx:                 ctx,
		Client:              clientset,
		Force:               opts.Force,
		GracePeriodSeconds:  opts.GracePeriodSeconds,
		IgnoreAllDaemonSets: opts.IgnoreAllDaemonSets,
		Timeout:             opts.Timeout,
		DeleteEmptyDirData:  opts.DeleteEmptyDirData,
		DisableEviction:     opts.DisableEviction,
		Out:                 buf,
		ErrOut:              buf,
		DryRunStrategy:      util.DryRunNone,
	}

	log.Debug().
		Str("context", "libkubectl").
		Str("node_name", nodeName).
		Bool("force", drainer.Force).
		Bool("ignore_daemon_sets", drainer.IgnoreAllDaemonSets).
		Dur("timeout", drainer.Timeout).
		Msg("Configured drain helper")

	// Get the node first
	node, err := clientset.CoreV1().Nodes().Get(ctx, nodeName, metav1.GetOptions{})
	if err != nil {
		log.Error().
			Str("context", "libkubectl").
			Str("node_name", nodeName).
			Err(err).
			Msg("Failed to retrieve node for drain operation")
		return "", fmt.Errorf("failed to get node %s for drain operation: %w", nodeName, err)
	}

	log.Debug().
		Str("context", "libkubectl").
		Str("node_name", nodeName).
		Msg("Successfully retrieved node, proceeding to cordon")

	// First cordon the node
	if err := drain.RunCordonOrUncordon(drainer, node, true); err != nil {
		log.Error().
			Str("context", "libkubectl").
			Str("node_name", nodeName).
			Err(err).
			Msg("Failed to cordon node during drain operation")
		return "", fmt.Errorf("failed to cordon node %s during drain operation: %w", nodeName, err)
	}

	log.Debug().
		Str("context", "libkubectl").
		Str("node_name", nodeName).
		Msg("Successfully cordoned node, proceeding to drain")

	// Skip the Portainer agent pod in the normal drain pass and evict it
	// separately, last (see evictAgentAndWaitForFailover).
	agentPodsOnNode := findAgentPodsOnNode(ctx, clientset, nodeName)
	if len(agentPodsOnNode) > 0 {
		drainer.AdditionalFilters = append(drainer.AdditionalFilters, skipPodsFilter(agentPodsOnNode))
	}

	// Then drain it
	if err := drain.RunNodeDrain(drainer, nodeName); err != nil {
		log.Error().
			Str("context", "libkubectl").
			Str("node_name", nodeName).
			Err(err).
			Msg("Failed to drain node")
		return "", fmt.Errorf("failed to drain node %s: %w", nodeName, err)
	}

	evictAgentAndWaitForFailover(ctx, drainer, clientset, nodeName, agentPodsOnNode)

	log.Debug().
		Str("context", "libkubectl").
		Str("node_name", nodeName).
		Msg("Successfully completed node drain operation")

	return buf.String(), nil
}
