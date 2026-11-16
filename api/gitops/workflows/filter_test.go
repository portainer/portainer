package workflows

import (
	"errors"
	"os"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/kubernetes/cli"
	"github.com/portainer/portainer/api/stacks/stackutils"

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

func TestFilterDockerStacksByAccess_ExcludesStacksOnInaccessibleEnvironments(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	const (
		userID            portainer.UserID     = 1
		accessibleEnvID   portainer.EndpointID = 1
		inaccessibleEnvID portainer.EndpointID = 2
	)

	group := &portainer.EndpointGroup{Name: "Unassigned"}
	require.NoError(t, store.EndpointGroup().Create(group))
	require.NoError(t, store.Endpoint().Create(&portainer.Endpoint{
		ID:                 accessibleEnvID,
		Type:               portainer.DockerEnvironment,
		GroupID:            group.ID,
		UserAccessPolicies: portainer.UserAccessPolicies{userID: {}},
	}))
	require.NoError(t, store.Endpoint().Create(&portainer.Endpoint{ID: inaccessibleEnvID, Type: portainer.DockerEnvironment, GroupID: group.ID}))

	stacks := []portainer.Stack{
		{ID: 1, Name: "accessible", EndpointID: accessibleEnvID, Type: portainer.DockerComposeStack},
		{ID: 2, Name: "inaccessible", EndpointID: inaccessibleEnvID, Type: portainer.DockerComposeStack},
	}
	for _, s := range stacks {
		require.NoError(t, store.ResourceControl().Create(authorization.NewPublicResourceControl(stackutils.ResourceControlID(s.EndpointID, s.Name), portainer.StackResourceControl)))
	}

	sc := &security.RestrictedRequestContext{UserID: userID}

	var result []portainer.Stack
	err := store.ViewTx(func(tx dataservices.DataStoreTx) error {
		var txErr error
		result, txErr = FilterDockerStacksByAccess(tx, stacks, sc)
		return txErr
	})
	require.NoError(t, err)
	require.Len(t, result, 1)
	require.Equal(t, "accessible", result[0].Name)
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

	_, store := datastore.MustNewTestStore(t, false, true)

	var result map[portainer.EndpointID]endpointAccess
	err := store.ViewTx(func(tx dataservices.DataStoreTx) error {
		var txErr error
		result, txErr = buildEndpointAccessMap(tx, nil, sc, endpointMap)

		return txErr
	})
	require.NoError(t, err)
	require.Len(t, result, 1)
	require.True(t, result[1].IsKubeAdmin)
	require.Empty(t, result[1].NonAdminNamespaces)
}

func TestBuildEndpointAccessMap_MissingGroupGetsNoAccess(t *testing.T) {
	t.Parallel()

	sc := &security.RestrictedRequestContext{UserID: 1}

	endpointMap := map[portainer.EndpointID]portainer.Endpoint{
		1: {
			ID:                 1,
			Type:               portainer.KubernetesLocalEnvironment,
			GroupID:            99,
			UserAccessPolicies: portainer.UserAccessPolicies{1: {}},
		},
	}

	_, store := datastore.MustNewTestStore(t, false, true)

	var result map[portainer.EndpointID]endpointAccess
	err := store.ViewTx(func(tx dataservices.DataStoreTx) error {
		var txErr error
		result, txErr = buildEndpointAccessMap(tx, nil, sc, endpointMap)

		return txErr
	})
	require.NoError(t, err)
	require.Contains(t, result, portainer.EndpointID(1))
	require.False(t, result[1].IsKubeAdmin)
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

func TestFilterK8SStacks_NonAdminNamespaces(t *testing.T) {
	t.Parallel()

	const configMap = "apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: cm\n"

	for _, tc := range []struct {
		name            string
		namespace       string
		manifest        string
		expectedVisible bool
	}{
		{
			name:            "stack namespace not granted",
			namespace:       "not-accessible",
			manifest:        configMap,
			expectedVisible: false,
		},
		{
			name:            "manifest namespace not granted",
			manifest:        configMap + "  namespace: not-accessible\n",
			expectedVisible: false,
		},
		{
			name:            "stack namespace granted",
			namespace:       "accessible",
			manifest:        configMap,
			expectedVisible: true,
		},
		{
			name:            "manifest namespace granted",
			manifest:        configMap + "  namespace: accessible\n",
			expectedVisible: true,
		},
		{
			name:            "stack and manifest namespaces conflict",
			namespace:       "accessible",
			manifest:        configMap + "  namespace: not-accessible\n",
			expectedVisible: false,
		},
		{
			name:            "no namespace resolves to default",
			manifest:        configMap,
			expectedVisible: false,
		},
		{
			name:            "namespace object counts as its name",
			manifest:        "apiVersion: v1\nkind: Namespace\nmetadata:\n  name: accessible\n",
			expectedVisible: true,
		},
		{
			name:            "cluster-scoped object is admin only",
			manifest:        "apiVersion: rbac.authorization.k8s.io/v1\nkind: ClusterRole\nmetadata:\n  name: cr\n",
			expectedVisible: false,
		},
		{
			name:            "empty manifest and not stack namespace",
			expectedVisible: false,
		},
	} {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			projectPath := t.TempDir()
			if tc.manifest != "" {
				require.NoError(t, os.WriteFile(filesystem.JoinPaths(projectPath, "stack.yaml"), []byte(tc.manifest), 0o600))
			}

			stacks := []portainer.Stack{{
				ID:          1,
				EndpointID:  1,
				Namespace:   tc.namespace,
				Type:        portainer.KubernetesStack,
				ProjectPath: projectPath,
				EntryPoint:  "stack.yaml",
			}}

			accessMap := map[portainer.EndpointID]endpointAccess{
				1: {NonAdminNamespaces: []string{"accessible"}},
			}

			gotVisible := len(filterK8SStacks(stacks, accessMap)) > 0

			assert.Equal(t, tc.expectedVisible, gotVisible)
		})
	}
}

func TestResolveKubeAccess_NonAdmin(t *testing.T) {
	t.Parallel()

	for _, tc := range []struct {
		name               string
		userAccess         portainer.UserAccessPolicies
		teamAccess         portainer.TeamAccessPolicies
		missingGroup       bool
		expectedNamespaces []string
	}{
		{name: "with user access", userAccess: portainer.UserAccessPolicies{1: {}}, expectedNamespaces: []string{"default"}},
		{name: "with team access", teamAccess: portainer.TeamAccessPolicies{5: {}}, expectedNamespaces: []string{"default"}},
		{name: "without environment access"},
		{name: "with user access but missing group", userAccess: portainer.UserAccessPolicies{1: {}}, missingGroup: true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			var group *portainer.EndpointGroup
			if !tc.missingGroup {
				group = &portainer.EndpointGroup{ID: 1, Name: "Unassigned"}
			}

			ep := &portainer.Endpoint{
				ID:                 1,
				Type:               portainer.KubernetesLocalEnvironment,
				GroupID:            1,
				UserAccessPolicies: tc.userAccess,
				TeamAccessPolicies: tc.teamAccess,
			}

			factory := cli.NewTestClientFactory(1, cli.NewTestKubeClient(kfake.NewSimpleClientset()))

			sc := &security.RestrictedRequestContext{
				UserID:          1,
				UserMemberships: []portainer.TeamMembership{{UserID: 1, TeamID: 5}},
			}

			access, err := ResolveKubeAccess(factory, sc, ep, group)
			require.NoError(t, err)
			require.False(t, access.IsKubeAdmin)
			require.Equal(t, tc.expectedNamespaces, access.NonAdminNamespaces)
		})
	}
}
