package cli

import (
	"encoding/json"

	portainer "github.com/portainer/portainer/api"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// GetNamespaceAccessPolicies gets the namespace access policies
// from config maps in the portainer namespace
func (kcl *KubeClient) GetNamespaceAccessPolicies() (
	map[string]portainer.K8sNamespaceAccessPolicy, error,
) {
	configMap, err := kcl.cli.CoreV1().ConfigMaps(portainerNamespace).Get(portainerConfigMapName, metav1.GetOptions{})
	if k8serrors.IsNotFound(err) {
		return nil, nil
	} else if err != nil {
		return nil, err
	}

	accessData := configMap.Data[portainerConfigMapAccessPoliciesKey]

	var policies map[string]portainer.K8sNamespaceAccessPolicy
	err = json.Unmarshal([]byte(accessData), &policies)
	if err != nil {
		return nil, err
	}
	return policies, nil
}

// UpdateNamespaceAccessPolicies updates the namespace access policies
func (kcl *KubeClient) UpdateNamespaceAccessPolicies(
	accessPolicies map[string]portainer.K8sNamespaceAccessPolicy,
) error {

	data, err := json.Marshal(accessPolicies)
	if err != nil {
		return err
	}

	configMap, err := kcl.cli.CoreV1().ConfigMaps(portainerNamespace).Get(portainerConfigMapName, metav1.GetOptions{})
	if k8serrors.IsNotFound(err) {
		return nil
	} else if err != nil {
		return err
	}
	configMap.Data[portainerConfigMapAccessPoliciesKey] = string(data)
	_, err = kcl.cli.CoreV1().ConfigMaps(portainerNamespace).Update(configMap)
	if err != nil {
		return err
	}

	return nil
}
