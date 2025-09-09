package libkubectl

import (
	"bytes"
	"context"
	"fmt"
	"time"

	"github.com/rs/zerolog/log"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/kubectl/pkg/cmd/util"
	"k8s.io/kubectl/pkg/drain"
)

// DrainNode drains a node from the cluster
func (c *Client) DrainNode(nodeName string) (string, error) {
	log.Debug().
		Str("context", "libkubectl").
		Str("node_name", nodeName).
		Msg("Starting node drain operation")

	buf := new(bytes.Buffer)

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

	drainer := &drain.Helper{
		Ctx:                 context.Background(),
		Client:              clientset,
		Force:               false,            // Don't force delete standalone pods
		GracePeriodSeconds:  -1,               // Use pod's own grace period
		IgnoreAllDaemonSets: true,             // Skip DaemonSet pods
		Timeout:             60 * time.Second, // Overall timeout
		DeleteEmptyDirData:  true,             // Delete pods with emptyDir
		DisableEviction:     false,            // Use eviction API when possible
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
	node, err := clientset.CoreV1().Nodes().Get(context.Background(), nodeName, metav1.GetOptions{})
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

	// Then drain it
	if err := drain.RunNodeDrain(drainer, nodeName); err != nil {
		log.Error().
			Str("context", "libkubectl").
			Str("node_name", nodeName).
			Err(err).
			Msg("Failed to drain node")
		return "", fmt.Errorf("failed to drain node %s: %w", nodeName, err)
	}

	log.Debug().
		Str("context", "libkubectl").
		Str("node_name", nodeName).
		Msg("Successfully completed node drain operation")

	return buf.String(), nil
}
