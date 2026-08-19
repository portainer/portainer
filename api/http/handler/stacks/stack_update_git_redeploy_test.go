package stacks

import (
	"context"
	"errors"
	"net/http"
	"os"
	"sync"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/dataservices/source"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/filesystem"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/stacks/stackutils"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/stretchr/testify/require"
)

type stubKubernetesDeployer struct {
	portainer.KubernetesDeployer
	deployErr error
}

func (f *stubKubernetesDeployer) Deploy(_ context.Context, _ portainer.UserID, _ *portainer.Endpoint, _ []string, _ string) (string, error) {
	return "", f.deployErr
}

func mockDeployKubernetesStackInlineRequest() *http.Request {
	req := mockCreateStackRequestWithSecurityContext(http.MethodPut, "/stacks/1/git/redeploy", nil)

	return req.WithContext(security.StoreTokenData(req, &portainer.TokenData{ID: 1, Username: "admin", Role: portainer.AdministratorRole}))
}

func TestResolveGitAuthFromRedeployPayload(t *testing.T) {
	t.Parallel()

	existing := &gittypes.GitAuthentication{
		Username: "existing-user",
		Password: "existing-pass",
	}

	tests := []struct {
		name    string
		auth    *gittypes.GitAuthentication
		payload stackGitRedeployPayload
		want    gittypes.GitAuthentication
	}{
		{
			name:    "no existing auth, flag off, no creds",
			auth:    nil,
			payload: stackGitRedeployPayload{RepositoryAuthentication: false},
			want:    gittypes.GitAuthentication{},
		},
		{
			name:    "no existing auth, flag off, creds provided",
			auth:    nil,
			payload: stackGitRedeployPayload{RepositoryAuthentication: false, RepositoryPassword: "pass"},
			want:    gittypes.GitAuthentication{},
		},
		{
			name:    "no existing auth, flag on, empty password",
			auth:    nil,
			payload: stackGitRedeployPayload{RepositoryAuthentication: true, RepositoryUsername: "user"},
			want:    gittypes.GitAuthentication{},
		},
		{
			name:    "no existing auth, flag on, password set",
			auth:    nil,
			payload: stackGitRedeployPayload{RepositoryAuthentication: true, RepositoryUsername: "user", RepositoryPassword: "pass"},
			want:    gittypes.GitAuthentication{Username: "user", Password: "pass"},
		},
		{
			name:    "no existing auth, flag on, password set but no username",
			auth:    nil,
			payload: stackGitRedeployPayload{RepositoryAuthentication: true, RepositoryPassword: "pass"},
			want:    gittypes.GitAuthentication{Username: "", Password: "pass"},
		},
		{
			name:    "existing auth, flag off",
			auth:    existing,
			payload: stackGitRedeployPayload{RepositoryAuthentication: false},
			want:    *existing,
		},
		{
			name:    "existing auth, flag on, empty password",
			auth:    existing,
			payload: stackGitRedeployPayload{RepositoryAuthentication: true, RepositoryUsername: "new-user"},
			want:    *existing,
		},
		{
			name:    "existing auth, flag on, password set",
			auth:    existing,
			payload: stackGitRedeployPayload{RepositoryAuthentication: true, RepositoryUsername: "new-user", RepositoryPassword: "new-pass"},
			want:    gittypes.GitAuthentication{Username: "new-user", Password: "new-pass"},
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			cfg := &gittypes.RepoConfig{Authentication: tc.auth}
			got := resolveGitAuthFromRedeployPayload(cfg, tc.payload)
			require.Equal(t, tc.want, got)
		})
	}
}

func setupDeployKubernetesStackInlineTest(t *testing.T, deployErr error, initialStatus portainer.StackStatus) (*Handler, *portainer.Stack, *gittypes.RepoConfig, portainer.SourceID, *security.RestrictedRequestContext) {
	t.Helper()

	manifest := `apiVersion: v1
kind: ConfigMap
metadata:
  name: test-config
  namespace: default
data:
  key: value
`
	configHash := "testhash"
	tempDir := t.TempDir()
	require.NoError(t, os.WriteFile(filesystem.JoinPaths(tempDir, "manifest.yml"), []byte(manifest), 0o644))

	_, store := datastore.MustNewTestStore(t, true, false)

	adminUserContext := source.InsecureNewAdminContext()

	src := &portainer.Source{
		Type: portainer.SourceTypeGit,
		Git:  &gittypes.GitSource{URL: "https://example.com/repo.git"},
	}
	require.NoError(t, store.Source().Create(adminUserContext, src))

	stack := &portainer.Stack{
		ID:          1,
		Name:        "k8s-stack",
		Type:        portainer.KubernetesStack,
		EndpointID:  1,
		Namespace:   "default",
		ProjectPath: tempDir,
		EntryPoint:  "manifest.yml",
		Status:      initialStatus,
	}

	wf := &portainer.Workflow{
		Artifacts: []portainer.Artifact{{
			StackID: stack.ID,
			Files:   []portainer.ArtifactFile{{SourceID: src.ID, Ref: "refs/heads/main", Hash: configHash}},
		}},
	}
	require.NoError(t, store.Workflow().Create(wf))
	stack.WorkflowID = wf.ID

	require.NoError(t, store.Stack().Create(stack))

	handler := &Handler{
		DataStore:          store,
		KubernetesDeployer: &stubKubernetesDeployer{deployErr: deployErr},
		stackCreationMutex: &sync.Mutex{},
	}

	gitConfig := &gittypes.RepoConfig{URL: src.Git.URL, ReferenceName: "refs/heads/main", ConfigHash: configHash}
	securityContext := &security.RestrictedRequestContext{
		IsAdmin: true,
		UserID:  1,
		User:    &portainer.User{ID: 1, Role: portainer.AdministratorRole},
	}

	return handler, stack, gitConfig, src.ID, securityContext
}

func TestDeployKubernetesStackInline(t *testing.T) {
	t.Parallel()

	t.Run("successful redeploys persist Active status inline, with no goroutine to wait on, and reset DeploymentStatus on each attempt", func(t *testing.T) {
		t.Parallel()

		handler, stack, gitConfig, sourceID, securityContext := setupDeployKubernetesStackInlineTest(t, nil, portainer.StackStatusActive)
		req := mockDeployKubernetesStackInlineRequest()

		var postDeployCalls int
		postDeploy := func(_ context.Context, _ error) {
			postDeployCalls++
		}

		deployOnce := func() *httperror.HandlerError {
			stackutils.PrepareStackStatusForDeployment(stack)
			deploymentConfig, httpErr := handler.deployStack(req, stack, false, &portainer.Endpoint{})
			require.Nil(t, httpErr)
			return handler.deployKubernetesStackInline(deploymentConfig, stack, securityContext, gitConfig, sourceID, postDeploy)
		}

		httpErr := deployOnce()
		require.Nil(t, httpErr)

		var updated *portainer.Stack
		require.NoError(t, handler.DataStore.ViewTx(func(tx dataservices.DataStoreTx) error {
			var err error
			updated, err = tx.Stack().Read(stack.ID)
			return err
		}))
		require.Equal(t, portainer.StackStatusActive, updated.Status)
		require.Len(t, updated.DeploymentStatus, 2, "expected a Deploying entry followed by an Active entry")
		require.Equal(t, portainer.StackStatusActive, updated.DeploymentStatus[1].Status)
		require.Equal(t, 1, postDeployCalls, "postDeploy should be called after a successful inline deploy")

		httpErr = deployOnce()
		require.Nil(t, httpErr)

		require.NoError(t, handler.DataStore.ViewTx(func(tx dataservices.DataStoreTx) error {
			var err error
			updated, err = tx.Stack().Read(stack.ID)
			return err
		}))
		require.Equal(t, portainer.StackStatusActive, updated.Status)
		require.Len(t, updated.DeploymentStatus, 2, "DeploymentStatus should be reset on each redeploy, not accumulate across redeploys")
		require.Equal(t, portainer.StackStatusActive, updated.DeploymentStatus[1].Status)
		require.Equal(t, 2, postDeployCalls)
	})

	t.Run("failed deploy returns an error, leaves the stack untouched, and still calls postDeploy with the error", func(t *testing.T) {
		t.Parallel()

		deployErr := errors.New("failed to apply resources")
		handler, stack, gitConfig, sourceID, securityContext := setupDeployKubernetesStackInlineTest(t, deployErr, portainer.StackStatusActive)
		req := mockDeployKubernetesStackInlineRequest()

		var postDeployCalled bool
		var postDeployErr error
		postDeploy := func(_ context.Context, err error) {
			postDeployCalled = true
			postDeployErr = err
		}

		stackutils.PrepareStackStatusForDeployment(stack)
		deploymentConfig, httpErr := handler.deployStack(req, stack, false, &portainer.Endpoint{})
		require.Nil(t, httpErr)

		httpErr = handler.deployKubernetesStackInline(deploymentConfig, stack, securityContext, gitConfig, sourceID, postDeploy)
		require.NotNil(t, httpErr)

		var unchanged *portainer.Stack
		require.NoError(t, handler.DataStore.ViewTx(func(tx dataservices.DataStoreTx) error {
			var err error
			unchanged, err = tx.Stack().Read(stack.ID)
			return err
		}))
		require.Equal(t, portainer.StackStatusActive, unchanged.Status, "status should be untouched since nothing should be persisted on deploy failure")
		require.Empty(t, unchanged.DeploymentStatus, "no deployment status entry should be recorded on failure")

		require.True(t, postDeployCalled, "postDeploy should be called on failure too, consistent with the file-based inline deploy path")
		require.ErrorIs(t, postDeployErr, deployErr)
	})

	t.Run("non-owner standard user with granted access can redeploy", func(t *testing.T) {
		t.Parallel()

		handler, stack, gitConfig, sourceID, _ := setupDeployKubernetesStackInlineTest(t, nil, portainer.StackStatusActive)

		standardUser := &portainer.User{Username: "standarduser", Role: portainer.StandardUserRole}
		require.NoError(t, handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
			return tx.User().Create(standardUser)
		}))

		adminUserContext := source.InsecureNewAdminContext()
		src, err := handler.DataStore.Source().Read(adminUserContext, sourceID)
		require.NoError(t, err)
		// AdministratorsOnly is a hard enforcement that defeats a UserAccesses grant, so it
		// must be cleared for the grant below to actually take effect.
		src.AdministratorsOnly = false
		src.UserAccesses = []portainer.UserID{standardUser.ID}
		require.NoError(t, handler.DataStore.Source().Update(adminUserContext, src.ID, src))

		standardSecurityContext := &security.RestrictedRequestContext{
			IsAdmin: false,
			UserID:  standardUser.ID,
			User:    standardUser,
		}

		req := mockDeployKubernetesStackInlineRequest()
		stackutils.PrepareStackStatusForDeployment(stack)
		deploymentConfig, httpErr := handler.deployStack(req, stack, false, &portainer.Endpoint{})
		require.Nil(t, httpErr)

		httpErr = handler.deployKubernetesStackInline(deploymentConfig, stack, standardSecurityContext, gitConfig, sourceID, nil)
		require.Nil(t, httpErr)

		updatedSrc, err := handler.DataStore.Source().Read(adminUserContext, sourceID)
		require.NoError(t, err)
		require.Equal(t, portainer.SourceStatusHealthy, updatedSrc.Status)
	})
}
