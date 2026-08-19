package cli

import (
	"context"
	"regexp"

	models "github.com/portainer/portainer/api/http/models/kubernetes"

	"github.com/segmentio/encoding/json"
)

// featureGateEnabled reports whether the named Kubernetes feature gate is active
// on the API server by scraping /metrics and checking the
// kubernetes_feature_enabled gauge for that gate name.
func (kcl *KubeClient) featureGateEnabled(ctx context.Context, gate string) (bool, error) {
	raw, err := kcl.cli.CoreV1().RESTClient().Get().
		AbsPath("/metrics").
		DoRaw(ctx)
	if err != nil {
		return false, err
	}
	re := regexp.MustCompile(`(?m)kubernetes_feature_enabled\{[^}]*name="` + regexp.QuoteMeta(gate) + `"[^}]*\}\s+1$`)
	return re.Match(raw), nil
}

// SupportsPodRestart reports whether the RestartAllContainersOnContainerExits
// feature gate is active, which is required for the pods/restart subresource.
func (kcl *KubeClient) SupportsPodRestart(ctx context.Context) (bool, error) {
	return kcl.featureGateEnabled(ctx, "RestartAllContainersOnContainerExits")
}

func (kcl *KubeClient) GetMetrics() (models.K8sMetrics, error) {
	var metrics models.K8sMetrics
	resp, err := kcl.cli.CoreV1().RESTClient().Get().AbsPath("apis/metrics.k8s.io/v1beta1/nodes").DoRaw(context.Background())
	if err != nil {
		return metrics, err
	}

	err = json.Unmarshal(resp, &metrics)
	return metrics, err
}
