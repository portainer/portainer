package stacks

import (
	"cmp"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strconv"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/portainer/portainer/api/kubernetes/cli"

	"github.com/stretchr/testify/require"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	kfake "k8s.io/client-go/kubernetes/fake"
)

const (
	k8sAccessEndpointID portainer.EndpointID = 1

	k8sAccessAdminID        portainer.UserID = 1
	k8sAccessStandardUserID portainer.UserID = 2
	k8sAccessLegacyUserID   portainer.UserID = 3

	k8sAccessLegacyStackID          portainer.StackID = 1
	k8sAccessDefaultStackID         portainer.StackID = 2
	k8sAccessManifestDefaultStackID portainer.StackID = 3
	k8sAccessManifestLegacyStackID  portainer.StackID = 4
	k8sAccessManifestMixedStackID   portainer.StackID = 5
	k8sAccessManifestClusterStackID portainer.StackID = 6
	k8sAccessManifestMixedScopeID   portainer.StackID = 7
	k8sAccessDefaultMixedScopeID    portainer.StackID = 8
	k8sAccessManifestOwnNamespaceID portainer.StackID = 9
	k8sAccessLegacyOwnNamespaceID   portainer.StackID = 10
	k8sAccessPendingSettingsStackID portainer.StackID = 11
	k8sAccessManifestScopedRoleID   portainer.StackID = 12
	k8sAccessDefaultScopedRoleID    portainer.StackID = 13
	k8sAccessManifestListStackID    portainer.StackID = 14

	k8sAccessManifestFile = "manifest.yml"

	k8sAccessUndeclaredManifest   = "apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: probe\n"
	k8sAccessLegacyManifest       = "apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: probe\n  namespace: legacy\n"
	k8sAccessMixedManifest        = k8sAccessUndeclaredManifest + "---\n" + k8sAccessLegacyManifest
	k8sAccessClusterManifest      = "apiVersion: rbac.authorization.k8s.io/v1\nkind: ClusterRole\nmetadata:\n  name: probe\n"
	k8sAccessMixedScopeManifest   = k8sAccessUndeclaredManifest + "---\n" + k8sAccessClusterManifest
	k8sAccessOwnNamespaceManifest = "apiVersion: v1\nkind: Namespace\nmetadata:\n  name: legacy\n---\n" + k8sAccessLegacyManifest
	// k8sAccessScopedRoleManifest declares a namespace on a cluster-scoped ClusterRole, which
	// Kubernetes ignores.
	k8sAccessScopedRoleManifest = k8sAccessUndeclaredManifest + "---\napiVersion: rbac.authorization.k8s.io/v1\nkind: ClusterRole\nmetadata:\n  name: probe\n  namespace: default\n"
	k8sAccessListManifest       = "apiVersion: v1\nkind: List\nitems:\n- apiVersion: v1\n  kind: ConfigMap\n  metadata:\n    name: probe\n- apiVersion: v1\n  kind: ConfigMap\n  metadata:\n    name: probe\n    namespace: legacy\n"
)

// kubernetesAccessStack is a Kubernetes stack in the access fixture: the namespace stored on it
// and the manifest it deploys. An empty namespace means the stack deploys into the namespaces its
// manifest declares. entryPoint, when set, replaces the deployed manifest file the way saving git
// settings does before a redeploy.
type kubernetesAccessStack struct {
	namespace  string
	manifest   string
	entryPoint string
}

var kubernetesAccessStacks = map[portainer.StackID]kubernetesAccessStack{
	k8sAccessLegacyStackID:          {namespace: "legacy", manifest: k8sAccessUndeclaredManifest},
	k8sAccessDefaultStackID:         {namespace: "default", manifest: k8sAccessUndeclaredManifest},
	k8sAccessManifestDefaultStackID: {manifest: k8sAccessUndeclaredManifest},
	k8sAccessManifestLegacyStackID:  {manifest: k8sAccessLegacyManifest},
	k8sAccessManifestMixedStackID:   {manifest: k8sAccessMixedManifest},
	k8sAccessManifestClusterStackID: {manifest: k8sAccessClusterManifest},
	k8sAccessManifestMixedScopeID:   {manifest: k8sAccessMixedScopeManifest},
	k8sAccessDefaultMixedScopeID:    {namespace: "default", manifest: k8sAccessMixedScopeManifest},
	k8sAccessManifestOwnNamespaceID: {manifest: k8sAccessOwnNamespaceManifest},
	k8sAccessLegacyOwnNamespaceID:   {namespace: "legacy", manifest: k8sAccessOwnNamespaceManifest},
	k8sAccessPendingSettingsStackID: {manifest: k8sAccessUndeclaredManifest, entryPoint: "renamed.yml"},
	k8sAccessManifestScopedRoleID:   {manifest: k8sAccessScopedRoleManifest},
	k8sAccessDefaultScopedRoleID:    {namespace: "default", manifest: k8sAccessScopedRoleManifest},
	k8sAccessManifestListStackID:    {manifest: k8sAccessListManifest},
}

type kubernetesStackAccessCase struct {
	name                     string
	userID                   portainer.UserID
	stackID                  portainer.StackID
	restrictDefaultNamespace bool
	expectedStatus           int
}

// kubernetesStackAccessCases covers who may read a Kubernetes stack, judged by the namespace
// stored on the stack, or by the namespaces its manifest deploys into when none is stored.
var kubernetesStackAccessCases = []kubernetesStackAccessCase{
	{name: "admin reads a stack in any namespace", userID: k8sAccessAdminID, stackID: k8sAccessLegacyStackID, expectedStatus: http.StatusOK},
	{name: "standard user reads a stack in the default namespace", userID: k8sAccessStandardUserID, stackID: k8sAccessDefaultStackID, expectedStatus: http.StatusOK},
	{name: "standard user is denied a stack in a namespace not granted", userID: k8sAccessStandardUserID, stackID: k8sAccessLegacyStackID, expectedStatus: http.StatusForbidden},
	{name: "standard user reads a stack in a granted namespace", userID: k8sAccessLegacyUserID, stackID: k8sAccessLegacyStackID, expectedStatus: http.StatusOK},
	{name: "standard user is denied the default namespace when it is restricted", userID: k8sAccessStandardUserID, stackID: k8sAccessDefaultStackID, restrictDefaultNamespace: true, expectedStatus: http.StatusForbidden},
	{name: "standard user reads a manifest-namespace stack that falls back to default", userID: k8sAccessStandardUserID, stackID: k8sAccessManifestDefaultStackID, expectedStatus: http.StatusOK},
	{name: "standard user is denied a manifest-namespace stack in default when it is restricted", userID: k8sAccessStandardUserID, stackID: k8sAccessManifestDefaultStackID, restrictDefaultNamespace: true, expectedStatus: http.StatusForbidden},
	{name: "standard user is denied a manifest-namespace stack in a namespace not granted", userID: k8sAccessStandardUserID, stackID: k8sAccessManifestLegacyStackID, expectedStatus: http.StatusForbidden},
	{name: "standard user reads a manifest-namespace stack in a granted namespace", userID: k8sAccessLegacyUserID, stackID: k8sAccessManifestLegacyStackID, expectedStatus: http.StatusOK},
	{name: "standard user is denied a manifest-namespace stack spanning a namespace not granted", userID: k8sAccessStandardUserID, stackID: k8sAccessManifestMixedStackID, expectedStatus: http.StatusForbidden},
	{name: "standard user reads a manifest-namespace stack spanning only granted namespaces", userID: k8sAccessLegacyUserID, stackID: k8sAccessManifestMixedStackID, expectedStatus: http.StatusOK},
	{name: "standard user is denied a manifest-namespace stack with only cluster-scoped objects", userID: k8sAccessLegacyUserID, stackID: k8sAccessManifestClusterStackID, expectedStatus: http.StatusForbidden},
	{name: "admin reads a manifest-namespace stack with only cluster-scoped objects", userID: k8sAccessAdminID, stackID: k8sAccessManifestClusterStackID, expectedStatus: http.StatusOK},
	{name: "standard user is denied a manifest-namespace stack that also deploys cluster-scoped objects", userID: k8sAccessStandardUserID, stackID: k8sAccessManifestMixedScopeID, expectedStatus: http.StatusForbidden},
	{name: "standard user is denied a stack in a granted namespace that also deploys cluster-scoped objects", userID: k8sAccessStandardUserID, stackID: k8sAccessDefaultMixedScopeID, expectedStatus: http.StatusForbidden},
	{name: "admin reads a stack that also deploys cluster-scoped objects", userID: k8sAccessAdminID, stackID: k8sAccessDefaultMixedScopeID, expectedStatus: http.StatusOK},
	{name: "standard user reads a manifest-namespace stack that creates its granted namespace", userID: k8sAccessLegacyUserID, stackID: k8sAccessManifestOwnNamespaceID, expectedStatus: http.StatusOK},
	{name: "standard user is denied a manifest-namespace stack that creates a namespace not granted", userID: k8sAccessStandardUserID, stackID: k8sAccessManifestOwnNamespaceID, expectedStatus: http.StatusForbidden},
	{name: "standard user reads a stack that creates its own granted namespace", userID: k8sAccessLegacyUserID, stackID: k8sAccessLegacyOwnNamespaceID, expectedStatus: http.StatusOK},
	{name: "standard user is denied a manifest-namespace stack with a cluster-scoped object declaring a granted namespace", userID: k8sAccessStandardUserID, stackID: k8sAccessManifestScopedRoleID, expectedStatus: http.StatusForbidden},
	{name: "standard user is denied a stack in a granted namespace with a cluster-scoped object declaring it", userID: k8sAccessStandardUserID, stackID: k8sAccessDefaultScopedRoleID, expectedStatus: http.StatusForbidden},
	{name: "standard user is denied a manifest-namespace List spanning a namespace not granted", userID: k8sAccessStandardUserID, stackID: k8sAccessManifestListStackID, expectedStatus: http.StatusForbidden},
	{name: "standard user reads a manifest-namespace List spanning only granted namespaces", userID: k8sAccessLegacyUserID, stackID: k8sAccessManifestListStackID, expectedStatus: http.StatusOK},
}

// kubernetesStackInspectCases covers stacks whose manifests are not read from the entry point:
// saved but not redeployed git settings. Their /file reads fail on their own.
var kubernetesStackInspectCases = []kubernetesStackAccessCase{
	{name: "standard user reads a stack with saved but not redeployed settings", userID: k8sAccessStandardUserID, stackID: k8sAccessPendingSettingsStackID, expectedStatus: http.StatusOK},
}

// setupKubernetesStackAccess builds a stacks handler over a Kubernetes environment holding the
// kubernetesAccessStacks. Only the legacy user is granted `legacy`, through the cluster's
// portainer-config ConfigMap.
func setupKubernetesStackAccess(t *testing.T, restrictDefaultNamespace bool) *Handler {
	t.Helper()

	_, store := datastore.MustNewTestStore(t, false, true)

	users := []portainer.User{
		{ID: k8sAccessAdminID, Username: "admin", Role: portainer.AdministratorRole},
		{ID: k8sAccessStandardUserID, Username: "standard", Role: portainer.StandardUserRole},
		{ID: k8sAccessLegacyUserID, Username: "legacy", Role: portainer.StandardUserRole},
	}
	for i := range users {
		require.NoError(t, store.User().Create(&users[i]))
	}

	endpoint := &portainer.Endpoint{
		ID:   k8sAccessEndpointID,
		Name: "kubernetes",
		Type: portainer.KubernetesLocalEnvironment,
	}
	endpoint.Kubernetes.Configuration.RestrictDefaultNamespace = restrictDefaultNamespace
	require.NoError(t, store.Endpoint().Create(endpoint))

	accessPolicies, err := json.Marshal(map[string]portainer.K8sNamespaceAccessPolicy{
		"legacy": {UserAccessPolicies: portainer.UserAccessPolicies{k8sAccessLegacyUserID: {}}},
	})
	require.NoError(t, err)

	clientset := kfake.NewSimpleClientset(&corev1.ConfigMap{
		ObjectMeta: metav1.ObjectMeta{Name: "portainer-config", Namespace: "portainer"},
		Data:       map[string]string{"NamespaceAccessPolicies": string(accessPolicies)},
	})

	for stackID, stack := range kubernetesAccessStacks {
		projectPath := t.TempDir()
		require.NoError(t, os.WriteFile(filesystem.JoinPaths(projectPath, k8sAccessManifestFile), []byte(stack.manifest), 0o644))

		require.NoError(t, store.Stack().Create(&portainer.Stack{
			ID:                    stackID,
			Name:                  "stack-" + strconv.Itoa(int(stackID)),
			EndpointID:            k8sAccessEndpointID,
			Type:                  portainer.KubernetesStack,
			Namespace:             stack.namespace,
			ProjectPath:           projectPath,
			EntryPoint:            cmp.Or(stack.entryPoint, k8sAccessManifestFile),
			CurrentDeploymentInfo: &portainer.StackDeploymentInfo{ConfigFilePath: k8sAccessManifestFile},
		}))
	}

	fileService, err := filesystem.NewService(t.TempDir(), "")
	require.NoError(t, err)

	handler := NewHandler(testhelpers.NewTestRequestBouncer(), nil)
	handler.DataStore = store
	handler.FileService = fileService
	handler.KubernetesClientFactory = cli.NewTestClientFactory(k8sAccessEndpointID, cli.NewTestKubeClient(clientset))

	return handler
}

// serveAsUser sends a GET to target as the given user.
func serveAsUser(handler *Handler, userID portainer.UserID, target string) *httptest.ResponseRecorder {
	role := portainer.StandardUserRole
	if userID == k8sAccessAdminID {
		role = portainer.AdministratorRole
	}

	req := httptest.NewRequest(http.MethodGet, target, nil)
	req = req.WithContext(security.StoreTokenData(req, &portainer.TokenData{ID: userID, Role: role}))
	req = req.WithContext(security.StoreRestrictedRequestContext(req, &security.RestrictedRequestContext{
		IsAdmin:         role == portainer.AdministratorRole,
		UserID:          userID,
		User:            &portainer.User{ID: userID, Role: role},
		UserMemberships: []portainer.TeamMembership{},
	}))

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	return rr
}
