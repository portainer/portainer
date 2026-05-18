package workflows

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/kubernetes/cli"

	appsv1 "k8s.io/api/apps/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	kfake "k8s.io/client-go/kubernetes/fake"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestFilterDockerStacksByAccess_KubeStacksPassThrough(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	user := &portainer.User{
		ID:                      1,
		Username:                "standard",
		Role:                    portainer.StandardUserRole,
		PortainerAuthorizations: authorization.DefaultPortainerAuthorizations(),
	}
	require.NoError(t, store.User().Create(user))

	sc := &security.RestrictedRequestContext{
		IsAdmin: false,
		UserID:  1,
	}

	kubeStack := portainer.Stack{ID: 1, Name: "kube-stack", Type: portainer.KubernetesStack}
	dockerStack := portainer.Stack{ID: 2, Name: "docker-stack", Type: portainer.DockerComposeStack}

	stacks := []portainer.Stack{kubeStack, dockerStack}

	var result []portainer.Stack
	err := store.ViewTx(func(tx dataservices.DataStoreTx) error {
		var txErr error
		result, txErr = filterDockerStacksByAccess(tx, stacks, sc)
		return txErr
	})
	require.NoError(t, err)
	require.Len(t, result, 1)
	require.Equal(t, "kube-stack", result[0].Name)
}

func TestFilterDockerStacksByAccess_AdminGetsAll(t *testing.T) {
	t.Parallel()

	sc := &security.RestrictedRequestContext{
		IsAdmin: true,
		UserID:  1,
	}

	stacks := []portainer.Stack{
		{ID: 1, Name: "kube-stack", Type: portainer.KubernetesStack},
		{ID: 2, Name: "docker-stack", Type: portainer.DockerComposeStack},
	}

	result, err := filterDockerStacksByAccess(nil, stacks, sc)
	require.NoError(t, err)
	require.Len(t, result, 2)
}

func TestBuildEndpointAccessMap_AdminIsKubeAdmin(t *testing.T) {
	t.Parallel()

	sc := &security.RestrictedRequestContext{
		IsAdmin: true,
		UserID:  1,
	}

	endpointMap := map[portainer.EndpointID]portainer.Endpoint{
		1: {ID: 1, Type: portainer.KubernetesLocalEnvironment},
		2: {ID: 2, Type: portainer.DockerEnvironment},
	}

	result, err := buildEndpointAccessMap(nil, sc, endpointMap)
	require.NoError(t, err)
	require.Len(t, result, 1)
	require.True(t, result[1].isKubeAdmin)
	require.Empty(t, result[1].nonAdminNamespaces)
}

func TestFilterK8SStacks_IncludesMatchingStack(t *testing.T) {
	t.Parallel()

	fakeKubeClient := kfake.NewSimpleClientset()

	deployment := &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "my-app",
			Namespace: "default",
			Labels: map[string]string{
				"io.portainer.kubernetes.application.stackid": "1",
			},
		},
		Spec: appsv1.DeploymentSpec{
			Selector: &metav1.LabelSelector{MatchLabels: map[string]string{"app": "my-app"}},
		},
	}

	_, err := fakeKubeClient.AppsV1().Deployments("default").Create(t.Context(), deployment, metav1.CreateOptions{})
	require.NoError(t, err)

	kcl := cli.NewTestKubeClient(fakeKubeClient)
	factory := cli.NewTestClientFactory(1, kcl)

	endpointMap := map[portainer.EndpointID]portainer.Endpoint{
		1: {ID: 1, Type: portainer.KubernetesLocalEnvironment},
	}

	stacks := []portainer.Stack{
		{ID: 1, Name: "stack-name", EndpointID: 1, Type: portainer.KubernetesStack},
	}

	accessMap := map[portainer.EndpointID]endpointAccess{
		1: {isKubeAdmin: true},
	}

	result, err := filterK8SStacks(stacks, endpointMap, factory, accessMap)
	require.NoError(t, err)
	require.Len(t, result, 1)
	assert.Equal(t, "my-app", result[0].Name)
	assert.Equal(t, "default", result[0].Namespace)
}

func TestFilterK8SStacks_ExcludesStackWhenNoMatchingDeployment(t *testing.T) {
	t.Parallel()

	fakeKubeClient := kfake.NewSimpleClientset()
	kcl := cli.NewTestKubeClient(fakeKubeClient)
	factory := cli.NewTestClientFactory(1, kcl)

	endpointMap := map[portainer.EndpointID]portainer.Endpoint{
		1: {ID: 1, Type: portainer.KubernetesLocalEnvironment},
	}

	stacks := []portainer.Stack{
		{ID: 1, Name: "stack-name", EndpointID: 1, Type: portainer.KubernetesStack},
	}

	accessMap := map[portainer.EndpointID]endpointAccess{
		1: {isKubeAdmin: true},
	}

	result, err := filterK8SStacks(stacks, endpointMap, factory, accessMap)
	require.NoError(t, err)
	require.Empty(t, result)
}

func TestFilterK8SStacks_NonAdminWithNamespaceAccess(t *testing.T) {
	t.Parallel()

	fakeKubeClient := kfake.NewSimpleClientset()

	deployment := &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "my-app",
			Namespace: "ns1",
			Labels: map[string]string{
				"io.portainer.kubernetes.application.stackid": "1",
			},
		},
		Spec: appsv1.DeploymentSpec{
			Selector: &metav1.LabelSelector{MatchLabels: map[string]string{"app": "my-app"}},
		},
	}

	_, err := fakeKubeClient.AppsV1().Deployments("ns1").Create(t.Context(), deployment, metav1.CreateOptions{})
	require.NoError(t, err)

	kcl := cli.NewTestKubeClient(fakeKubeClient)
	factory := cli.NewTestClientFactory(1, kcl)

	endpointMap := map[portainer.EndpointID]portainer.Endpoint{
		1: {ID: 1, Type: portainer.KubernetesLocalEnvironment},
	}

	stacks := []portainer.Stack{
		{ID: 1, Name: "stack-name", EndpointID: 1, Type: portainer.KubernetesStack},
	}

	accessMap := map[portainer.EndpointID]endpointAccess{
		1: {isKubeAdmin: false, nonAdminNamespaces: []string{"ns1"}},
	}

	result, err := filterK8SStacks(stacks, endpointMap, factory, accessMap)
	require.NoError(t, err)
	require.Len(t, result, 1)
	assert.Equal(t, "my-app", result[0].Name)
}

func TestResolveKubeAccess_NonAdminWithTeamMemberships(t *testing.T) {
	t.Parallel()

	fakeKubeClient := kfake.NewSimpleClientset()
	kcl := cli.NewTestKubeClient(fakeKubeClient)
	factory := cli.NewTestClientFactory(1, kcl)

	ep := &portainer.Endpoint{
		ID:   1,
		Type: portainer.KubernetesLocalEnvironment,
	}

	sc := &security.RestrictedRequestContext{
		IsAdmin: false,
		UserID:  1,
		UserMemberships: []portainer.TeamMembership{
			{TeamID: 5},
		},
	}

	access, err := resolveKubeAccess(factory, sc, ep)
	require.NoError(t, err)
	require.False(t, access.isKubeAdmin)
	require.Equal(t, []string{"default"}, access.nonAdminNamespaces)
}

func TestResolveKubeAccess_NonAdmin(t *testing.T) {
	t.Parallel()

	fakeKubeClient := kfake.NewSimpleClientset()
	kcl := cli.NewTestKubeClient(fakeKubeClient)
	factory := cli.NewTestClientFactory(1, kcl)

	ep := &portainer.Endpoint{
		ID:   1,
		Type: portainer.KubernetesLocalEnvironment,
	}

	sc := &security.RestrictedRequestContext{
		IsAdmin: false,
		UserID:  1,
	}

	access, err := resolveKubeAccess(factory, sc, ep)
	require.NoError(t, err)
	require.False(t, access.isKubeAdmin)
	require.Equal(t, []string{"default"}, access.nonAdminNamespaces)
}

func TestFilterK8SStacks_NonAdminWithoutNamespaceAccess(t *testing.T) {
	t.Parallel()

	fakeKubeClient := kfake.NewSimpleClientset()

	deployment := &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "my-app",
			Namespace: "ns1",
			Labels: map[string]string{
				"io.portainer.kubernetes.application.stackid": "1",
			},
		},
		Spec: appsv1.DeploymentSpec{
			Selector: &metav1.LabelSelector{MatchLabels: map[string]string{"app": "my-app"}},
		},
	}

	_, err := fakeKubeClient.AppsV1().Deployments("ns1").Create(t.Context(), deployment, metav1.CreateOptions{})
	require.NoError(t, err)

	kcl := cli.NewTestKubeClient(fakeKubeClient)
	factory := cli.NewTestClientFactory(1, kcl)

	endpointMap := map[portainer.EndpointID]portainer.Endpoint{
		1: {ID: 1, Type: portainer.KubernetesLocalEnvironment},
	}

	stacks := []portainer.Stack{
		{ID: 1, Name: "stack-name", EndpointID: 1, Type: portainer.KubernetesStack},
	}

	accessMap := map[portainer.EndpointID]endpointAccess{
		1: {isKubeAdmin: false, nonAdminNamespaces: []string{}},
	}

	result, err := filterK8SStacks(stacks, endpointMap, factory, accessMap)
	require.NoError(t, err)
	require.Empty(t, result)
}
