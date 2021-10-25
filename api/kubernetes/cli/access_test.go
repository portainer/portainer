package cli

import (
	"context"
	"sync"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/stretchr/testify/assert"
	ktypes "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	kfake "k8s.io/client-go/kubernetes/fake"
)

func Test_NamespaceAccessPoliciesDeleteNamespace_updatesPortainerConfig_whenConfigExists(t *testing.T) {
	testcases := []struct {
		name              string
		namespaceToDelete string
		expectedConfig    map[string]portainer.K8sNamespaceAccessPolicy
	}{
		{
			name:              "doesn't change config, when designated namespace absent",
			namespaceToDelete: "missing-namespace",
			expectedConfig: map[string]portainer.K8sNamespaceAccessPolicy{
				"ns1": {UserAccessPolicies: portainer.UserAccessPolicies{2: {RoleID: 0}}},
				"ns2": {UserAccessPolicies: portainer.UserAccessPolicies{2: {RoleID: 0}}},
			},
		},
		{
			name:              "removes designated namespace from config, when namespace is present",
			namespaceToDelete: "ns2",
			expectedConfig: map[string]portainer.K8sNamespaceAccessPolicy{
				"ns1": {UserAccessPolicies: portainer.UserAccessPolicies{2: {RoleID: 0}}},
			},
		},
	}

	for _, test := range testcases {
		t.Run(test.name, func(t *testing.T) {
			k := &KubeClient{
				cli:        kfake.NewSimpleClientset(),
				instanceID: "instance",
				lock:       &sync.Mutex{},
			}

			config := &ktypes.ConfigMap{
				ObjectMeta: metav1.ObjectMeta{
					Name:      portainerConfigMapName,
					Namespace: portainerNamespace,
				},
				Data: map[string]string{
					"NamespaceAccessPolicies": `{"ns1":{"UserAccessPolicies":{"2":{"RoleId":0}}}, "ns2":{"UserAccessPolicies":{"2":{"RoleId":0}}}}`,
				},
			}
			_, err := k.cli.CoreV1().ConfigMaps(portainerNamespace).Create(context.Background(), config, metav1.CreateOptions{})
			assert.NoError(t, err, "failed to create a portainer config")
			defer func() {
				k.cli.CoreV1().ConfigMaps(portainerNamespace).Delete(context.Background(), portainerConfigMapName, metav1.DeleteOptions{})
			}()

			err = k.NamespaceAccessPoliciesDeleteNamespace(test.namespaceToDelete)
			assert.NoError(t, err, "failed to delete namespace")

			policies, err := k.GetNamespaceAccessPolicies()
			assert.NoError(t, err, "failed to fetch policies")
			assert.Equal(t, test.expectedConfig, policies)
		})
	}
}
