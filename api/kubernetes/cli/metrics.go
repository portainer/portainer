package cli

import (
	"context"
	"encoding/json"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
)

func (kcl *KubeClient) GetMetrics() (models.K8sMetrics, error) {
	var metrics models.K8sMetrics
	resp, err := kcl.cli.CoreV1().RESTClient().Get().AbsPath("apis/metrics.k8s.io/v1beta1/nodes").DoRaw(context.Background())
	if err != nil {
		return metrics, err
	}

	err = json.Unmarshal(resp, &metrics)
	return metrics, err
}
