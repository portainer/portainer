package cli

import (
	"strings"
	"testing"

	portainer "github.com/portainer/portainer/api"

	"github.com/stretchr/testify/require"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	clientV1 "k8s.io/client-go/tools/clientcmd/api/v1"
)

// compareYAMLStrings will compare 2 strings by stripping tabs, newlines and whitespaces from both strings
func compareYAMLStrings(in1, in2 string) int {
	r := strings.NewReplacer("\t", "", "\n", "", " ", "")
	in1 = r.Replace(in1)
	in2 = r.Replace(in2)
	return strings.Compare(in1, in2)
}

func Test_GenerateYAML(t *testing.T) {
	t.Parallel()
	resourceYAMLTests := []struct {
		title    string
		resource runtime.Object
		wantYAML string
	}{
		{
			title: "Config",
			resource: &clientV1.Config{
				APIVersion:     "v1",
				Kind:           "Config",
				CurrentContext: "portainer-ctx",
				Contexts: []clientV1.NamedContext{
					{
						Name: "portainer-ctx",
						Context: clientV1.Context{
							AuthInfo: "test-user",
							Cluster:  "portainer-cluster",
						},
					},
				},
				Clusters: []clientV1.NamedCluster{
					{
						Name: "portainer-cluster",
						Cluster: clientV1.Cluster{
							Server:                "localhost",
							InsecureSkipTLSVerify: true,
						},
					},
				},
				AuthInfos: []clientV1.NamedAuthInfo{
					{
						Name: "test-user",
						AuthInfo: clientV1.AuthInfo{
							Token: "test-token",
						},
					},
				},
			},
			wantYAML: `
			apiVersion: v1
			clusters:
			- cluster:
					insecure-skip-tls-verify: true
					server: localhost
				name: portainer-cluster
			contexts:
			- context:
					cluster: portainer-cluster
					user: test-user
				name: portainer-ctx
			current-context: portainer-ctx
			kind: Config
			users:
			- name: test-user
				user:
					token: test-token
			`,
		},
	}

	for _, ryt := range resourceYAMLTests {
		t.Run(ryt.title, func(t *testing.T) {
			yaml, err := GenerateYAML(ryt.resource)
			if err != nil {
				t.Errorf("generateYamlConfig failed; err=%s", err)
			}

			if compareYAMLStrings(yaml, ryt.wantYAML) != 0 {
				t.Errorf("generateYamlConfig failed;\ngot=\n%s\nwant=\n%s", yaml, ryt.wantYAML)
			}
		})
	}
}

func TestGetResourceQuotaFromNamespace(t *testing.T) {
	t.Parallel()
	kcl := &KubeClient{}

	namespace := portainer.K8sNamespaceInfo{Name: "my-namespace"}
	resourceQuotas := []v1.ResourceQuota{
		{
			ObjectMeta: metav1.ObjectMeta{
				Name:      "portainer-rq-" + namespace.Name + "-1",
				Namespace: namespace.Name,
			},
		},
		{
			ObjectMeta: metav1.ObjectMeta{
				Name:      "portainer-rq-" + namespace.Name,
				Namespace: namespace.Name,
			},
		},
	}

	rq := kcl.GetResourceQuotaFromNamespace(namespace, resourceQuotas)
	require.NotNil(t, rq)
	require.Equal(t, namespace.Name, rq.Namespace)

	// Empty cases
	rq = kcl.GetResourceQuotaFromNamespace(namespace, nil)
	require.Nil(t, rq)

	namespace.Name = "another-namespace"
	rq = kcl.GetResourceQuotaFromNamespace(namespace, resourceQuotas)
	require.Nil(t, rq)
}
