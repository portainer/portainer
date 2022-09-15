package cli

import (
	"context"
	"time"

	"github.com/portainer/portainer/api/database/models"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// GetConfigMapsAndSecrets gets all the ConfigMaps AND all the Secrets for a
// given namespace in a k8s endpoint. The result is a list of both config maps
// and secrets. The IsSecret boolean property indicates if a given struct is a
// secret or configmap.
func (kcl *KubeClient) GetConfigMapsAndSecrets(namespace string) ([]models.K8sConfigMapOrSecret, error) {
	mapsClient := kcl.cli.CoreV1().ConfigMaps(namespace)
	mapsList, err := mapsClient.List(context.Background(), v1.ListOptions{})
	if err != nil {
		return nil, err
	}

	// TODO: Applications
	var combined []models.K8sConfigMapOrSecret
	for _, m := range mapsList.Items {
		var cm models.K8sConfigMapOrSecret
		cm.UID = string(m.UID)
		cm.Name = m.Name
		cm.Namespace = m.Namespace
		cm.Annotations = m.Annotations
		cm.Data = m.Data
		cm.CreationDate = m.CreationTimestamp.Time.UTC().Format(time.RFC3339)
		cm.IsSecret = false
		combined = append(combined, cm)
	}

	secretClient := kcl.cli.CoreV1().Secrets(namespace)
	secretList, err := secretClient.List(context.Background(), v1.ListOptions{})
	if err != nil {
		return nil, err
	}

	for _, s := range secretList.Items {
		var secret models.K8sConfigMapOrSecret
		secret.UID = string(s.UID)
		secret.Name = s.Name
		secret.Namespace = s.Namespace
		secret.Annotations = s.Annotations
		secret.Data = msbToMss(s.Data)
		secret.CreationDate = s.CreationTimestamp.Time.UTC().Format(time.RFC3339)
		secret.IsSecret = true
		secret.SecretType = string(s.Type)
		combined = append(combined, secret)
	}

	return combined, nil
}

func msbToMss(msa map[string][]byte) map[string]string {
	mss := make(map[string]string, len(msa))
	for k, v := range msa {
		mss[k] = string(v)
	}
	return mss
}
