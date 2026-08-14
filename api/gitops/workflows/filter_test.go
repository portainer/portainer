package workflows

import (
	"errors"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/kubernetes/cli"

	kfake "k8s.io/client-go/kubernetes/fake"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestArtifactBackingExists_StackExists(t *testing.T) {
	t.Parallel()

	exists, err := ArtifactBackingExists(
		portainer.Artifact{StackID: 1},
		func(portainer.StackID) (bool, error) { return true, nil },
		func(portainer.EdgeStackID) (bool, error) { return false, nil },
	)
	require.NoError(t, err)
	require.True(t, exists)
}

func TestArtifactBackingExists_StackMissing(t *testing.T) {
	t.Parallel()

	exists, err := ArtifactBackingExists(
		portainer.Artifact{StackID: 999},
		func(portainer.StackID) (bool, error) { return false, nil },
		func(portainer.EdgeStackID) (bool, error) { return true, nil },
	)
	require.NoError(t, err)
	require.False(t, exists)
}

func TestArtifactBackingExists_EdgeStackExists(t *testing.T) {
	t.Parallel()

	exists, err := ArtifactBackingExists(
		portainer.Artifact{EdgeStackID: 1},
		func(portainer.StackID) (bool, error) { return false, nil },
		func(portainer.EdgeStackID) (bool, error) { return true, nil },
	)
	require.NoError(t, err)
	require.True(t, exists)
}

func TestArtifactBackingExists_NeitherIDSet(t *testing.T) {
	t.Parallel()

	exists, err := ArtifactBackingExists(
		portainer.Artifact{},
		func(portainer.StackID) (bool, error) { return true, nil },
		func(portainer.EdgeStackID) (bool, error) { return true, nil },
	)
	require.NoError(t, err)
	require.False(t, exists)
}

func TestArtifactBackingExists_PropagatesError(t *testing.T) {
	t.Parallel()

	wantErr := errors.New("boom")
	_, err := ArtifactBackingExists(
		portainer.Artifact{StackID: 1},
		func(portainer.StackID) (bool, error) { return false, wantErr },
		func(portainer.EdgeStackID) (bool, error) { return true, nil },
	)
	require.ErrorIs(t, err, wantErr)
}

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
		result, txErr = FilterDockerStacksByAccess(tx, stacks, sc)
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

	result, err := FilterDockerStacksByAccess(nil, stacks, sc)
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
	require.True(t, result[1].IsKubeAdmin)
	require.Empty(t, result[1].NonAdminNamespaces)
}

func TestFilterK8SStacks_AdminIncludesAllK8SStacks(t *testing.T) {
	t.Parallel()

	stacks := []portainer.Stack{
		{ID: 1, Name: "stack-name", EndpointID: 1, Namespace: "default", Type: portainer.KubernetesStack},
	}

	accessMap := map[portainer.EndpointID]endpointAccess{
		1: {IsKubeAdmin: true},
	}

	result := filterK8SStacks(stacks, accessMap)
	require.Len(t, result, 1)
	assert.Equal(t, "stack-name", result[0].Name)
	assert.Equal(t, "default", result[0].Namespace)
}

func TestFilterK8SStacks_DockerStacksPassThrough(t *testing.T) {
	t.Parallel()

	stacks := []portainer.Stack{
		{ID: 1, Name: "docker-stack", EndpointID: 1, Type: portainer.DockerComposeStack},
	}

	// No access is resolved for the endpoint; Docker stacks must still pass through.
	result := filterK8SStacks(stacks, map[portainer.EndpointID]endpointAccess{})
	require.Len(t, result, 1)
	assert.Equal(t, "docker-stack", result[0].Name)
}

func TestFilterK8SStacks_NonAdminWithNamespaceAccess(t *testing.T) {
	t.Parallel()

	stacks := []portainer.Stack{
		{ID: 1, Name: "stack-name", EndpointID: 1, Namespace: "ns1", Type: portainer.KubernetesStack},
	}

	accessMap := map[portainer.EndpointID]endpointAccess{
		1: {IsKubeAdmin: false, NonAdminNamespaces: []string{"ns1"}},
	}

	result := filterK8SStacks(stacks, accessMap)
	require.Len(t, result, 1)
	assert.Equal(t, "stack-name", result[0].Name)
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

	access, err := ResolveKubeAccess(factory, sc, ep)
	require.NoError(t, err)
	require.False(t, access.IsKubeAdmin)
	require.Equal(t, []string{"default"}, access.NonAdminNamespaces)
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

	access, err := ResolveKubeAccess(factory, sc, ep)
	require.NoError(t, err)
	require.False(t, access.IsKubeAdmin)
	require.Equal(t, []string{"default"}, access.NonAdminNamespaces)
}

func TestFilterK8SStacks_NonAdminWithoutNamespaceAccess(t *testing.T) {
	t.Parallel()

	stacks := []portainer.Stack{
		{ID: 1, Name: "stack-name", EndpointID: 1, Namespace: "ns1", Type: portainer.KubernetesStack},
	}

	accessMap := map[portainer.EndpointID]endpointAccess{
		1: {IsKubeAdmin: false, NonAdminNamespaces: []string{}},
	}

	result := filterK8SStacks(stacks, accessMap)
	require.Empty(t, result)
}
