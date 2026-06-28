package stacks

import (
	"bytes"
	"context"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strconv"
	"sync"
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices/source"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/filesystem"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/testhelpers"

	"github.com/google/uuid"
	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/require"
)

func TestStackUpdateGitWebhookUniqueness(t *testing.T) {
	t.Parallel()
	webhook, err := uuid.NewRandom()
	require.NoError(t, err)

	_, store := datastore.MustNewTestStore(t, false, false)

	endpoint := &portainer.Endpoint{
		ID:   123,
		Name: "endpoint1",
		Type: portainer.DockerEnvironment,
	}
	err = store.Endpoint().Create(endpoint)
	require.NoError(t, err)

	const stack1ID = portainer.StackID(456)
	const stack2ID = portainer.StackID(457)

	sharedSrc := &portainer.Source{
		Type: portainer.SourceTypeGit,
		Git:  &gittypes.RepoConfig{URL: "https://github.com/portainer/portainer.git"},
	}
	err = store.Source().Create(source.InsecureNewAdminContext(), sharedSrc)
	require.NoError(t, err)

	wf1 := &portainer.Workflow{Artifacts: []portainer.Artifact{{
		StackID: stack1ID,
		Files:   []portainer.ArtifactFile{{SourceID: sharedSrc.ID}},
	}}}
	err = store.Workflow().Create(wf1)
	require.NoError(t, err)

	wf2 := &portainer.Workflow{Artifacts: []portainer.Artifact{{
		StackID: stack2ID,
		Files:   []portainer.ArtifactFile{{SourceID: sharedSrc.ID}},
	}}}
	err = store.Workflow().Create(wf2)
	require.NoError(t, err)

	stack1 := portainer.Stack{
		ID:         stack1ID,
		EndpointID: endpoint.ID,
		WorkflowID: wf1.ID,
		AutoUpdate: &portainer.AutoUpdateSettings{
			Webhook: webhook.String(),
		},
	}

	err = store.Stack().Create(&stack1)
	require.NoError(t, err)

	stack2 := stack1
	stack2.ID = stack2ID
	stack2.AutoUpdate = nil
	stack2.WorkflowID = wf2.ID

	err = store.Stack().Create(&stack2)
	require.NoError(t, err)

	handler := NewHandler(testhelpers.NewTestRequestBouncer())
	handler.DataStore = store

	payload := &stackGitUpdatePayload{
		AutoUpdate: &portainer.AutoUpdateSettings{
			Webhook: webhook.String(),
		},
	}

	jsonPayload, err := json.Marshal(payload)
	require.NoError(t, err)

	url := "/stacks/" + strconv.Itoa(int(stack2.ID)) + "/git?endpointId=" + strconv.Itoa(int(endpoint.ID))
	req := httptest.NewRequest(http.MethodPost, url, bytes.NewReader(jsonPayload))

	rrc := &security.RestrictedRequestContext{
		IsAdmin: true,
		UserID:  1,
		User:    &portainer.User{ID: 1, Role: portainer.AdministratorRole},
	}
	req = req.WithContext(security.StoreRestrictedRequestContext(req, rrc))

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	require.Equal(t, http.StatusConflict, rr.Code)
}

func TestStackGitRedeployUsesSourceCredentialsWhenPayloadOmitsLegacyAuth(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, false, false)
	dataPath := t.TempDir()
	fileService, err := filesystem.NewService(dataPath, "files")
	require.NoError(t, err)

	user := &portainer.User{
		Username: "admin",
		Role:     portainer.AdministratorRole,
	}
	err = store.User().Create(user)
	require.NoError(t, err)

	endpoint := &portainer.Endpoint{
		ID:   123,
		Name: "endpoint1",
		Type: portainer.DockerEnvironment,
		SecuritySettings: portainer.EndpointSecuritySettings{
			AllowStackManagementForRegularUsers: true,
		},
	}
	err = store.Endpoint().Create(endpoint)
	require.NoError(t, err)

	const stackID = portainer.StackID(456)
	const (
		repositoryURL = "https://github.com/example/private.git"
		referenceName = "refs/heads/main"
		username      = "git-user"
		password      = "git-token"
		entryPoint    = "docker-compose.yml"
	)

	src := &portainer.Source{
		Type: portainer.SourceTypeGit,
		Git: &gittypes.RepoConfig{
			URL:           repositoryURL,
			TLSSkipVerify: true,
			Authentication: &gittypes.GitAuthentication{
				Username: username,
				Password: password,
			},
		},
	}
	err = store.Source().Create(source.InsecureNewAdminContext(), src)
	require.NoError(t, err)

	wf := &portainer.Workflow{Artifacts: []portainer.Artifact{{
		StackID: stackID,
		Files: []portainer.ArtifactFile{{
			SourceID: src.ID,
			Ref:      referenceName,
			Path:     entryPoint,
			Hash:     "old-hash",
		}},
	}}}
	err = store.Workflow().Create(wf)
	require.NoError(t, err)

	projectPath := filepath.Join(t.TempDir(), "project")
	require.NoError(t, os.MkdirAll(projectPath, 0755))
	require.NoError(t, os.WriteFile(filepath.Join(projectPath, entryPoint), []byte("services: {}\n"), 0644))

	stack := portainer.Stack{
		ID:          stackID,
		Name:        "private-stack",
		Type:        portainer.DockerComposeStack,
		EndpointID:  endpoint.ID,
		WorkflowID:  wf.ID,
		ProjectPath: projectPath,
		EntryPoint:  entryPoint,
		Option:      &portainer.StackOption{},
	}
	err = store.Stack().Create(&stack)
	require.NoError(t, err)

	gitService := &recordingGitService{commitID: "new-hash", composeFile: entryPoint}
	handler := NewHandler(testhelpers.NewTestRequestBouncer())
	handler.DataStore = store
	handler.FileService = fileService
	handler.GitService = gitService
	deployer := stackRedeployNoopDeployer{
		deployComposeCalled: make(chan struct{}),
	}
	handler.StackDeployer = deployer

	payload := &stackGitRedeployPayload{
		Env: []portainer.Pair{},
	}

	jsonPayload, err := json.Marshal(payload)
	require.NoError(t, err)

	url := "/stacks/" + strconv.Itoa(int(stack.ID)) + "/git/redeploy?endpointId=" + strconv.Itoa(int(endpoint.ID))
	req := httptest.NewRequest(http.MethodPut, url, bytes.NewReader(jsonPayload))

	rrc := &security.RestrictedRequestContext{
		IsAdmin: true,
		UserID:  user.ID,
		User:    user,
	}
	req = req.WithContext(security.StoreRestrictedRequestContext(req, rrc))

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	require.Equal(t, http.StatusOK, rr.Code, rr.Body.String())
	require.Equal(t, username, gitService.cloneUsername)
	require.Equal(t, password, gitService.clonePassword)
	require.Equal(t, username, gitService.latestCommitUsername)
	require.Equal(t, password, gitService.latestCommitPassword)

	select {
	case <-deployer.deployComposeCalled:
	case <-time.After(2 * time.Second):
		t.Fatal("timed out waiting for async stack deployment")
	}
}

type recordingGitService struct {
	mu sync.Mutex

	commitID    string
	composeFile string

	cloneUsername        string
	clonePassword        string
	latestCommitUsername string
	latestCommitPassword string
}

func (g *recordingGitService) CloneRepository(_ context.Context, destination, _, _, username, password string, _ bool) error {
	g.mu.Lock()
	defer g.mu.Unlock()

	g.cloneUsername = username
	g.clonePassword = password

	if err := os.MkdirAll(destination, 0755); err != nil {
		return err
	}

	return os.WriteFile(filepath.Join(destination, g.composeFile), []byte("services: {}\n"), 0644)
}

func (g *recordingGitService) LatestCommitID(_ context.Context, _, _, username, password string, _ bool) (string, error) {
	g.mu.Lock()
	defer g.mu.Unlock()

	g.latestCommitUsername = username
	g.latestCommitPassword = password

	return g.commitID, nil
}

func (g *recordingGitService) ListRefs(_ context.Context, _, _, _ string, _ bool, _ bool) ([]string, error) {
	return nil, nil
}

func (g *recordingGitService) ListFiles(_ context.Context, _, _, _, _ string, _, _ bool, _ []string, _ bool) ([]string, error) {
	return nil, nil
}

type stackRedeployNoopDeployer struct {
	deployComposeCalled chan struct{}
}

func (stackRedeployNoopDeployer) DeploySwarmStack(_ context.Context, _ *portainer.Stack, _ *portainer.Endpoint, _ []portainer.Registry, _, _ bool) error {
	return nil
}

func (d stackRedeployNoopDeployer) DeployComposeStack(_ context.Context, _ *portainer.Stack, _ *portainer.Endpoint, _ []portainer.Registry, _, _, _ bool) error {
	if d.deployComposeCalled != nil {
		close(d.deployComposeCalled)
	}

	return nil
}

func (stackRedeployNoopDeployer) UndeployComposeStack(_ context.Context, _ *portainer.Stack, _ *portainer.Endpoint) error {
	return nil
}

func (stackRedeployNoopDeployer) DeployKubernetesStack(_ context.Context, _ *portainer.Stack, _ *portainer.Endpoint, _ *portainer.User) error {
	return nil
}

func (stackRedeployNoopDeployer) DeployRemoteComposeStack(_ context.Context, _ portainer.UserID, _ *portainer.Stack, _ *portainer.Endpoint, _ []portainer.Registry, _, _, _ bool) error {
	return nil
}

func (stackRedeployNoopDeployer) UndeployRemoteComposeStack(_ context.Context, _ portainer.UserID, _ *portainer.Stack, _ *portainer.Endpoint) error {
	return nil
}

func (stackRedeployNoopDeployer) StartRemoteComposeStack(_ context.Context, _ portainer.UserID, _ *portainer.Stack, _ *portainer.Endpoint, _ []portainer.Registry) error {
	return nil
}

func (stackRedeployNoopDeployer) StopRemoteComposeStack(_ context.Context, _ portainer.UserID, _ *portainer.Stack, _ *portainer.Endpoint) error {
	return nil
}

func (stackRedeployNoopDeployer) DeployRemoteSwarmStack(_ context.Context, _ portainer.UserID, _ *portainer.Stack, _ *portainer.Endpoint, _ []portainer.Registry, _, _ bool) error {
	return nil
}

func (stackRedeployNoopDeployer) UndeployRemoteSwarmStack(_ context.Context, _ portainer.UserID, _ *portainer.Stack, _ *portainer.Endpoint) error {
	return nil
}

func (stackRedeployNoopDeployer) StartRemoteSwarmStack(_ context.Context, _ portainer.UserID, _ *portainer.Stack, _ *portainer.Endpoint, _ []portainer.Registry) error {
	return nil
}

func (stackRedeployNoopDeployer) StopRemoteSwarmStack(_ context.Context, _ portainer.UserID, _ *portainer.Stack, _ *portainer.Endpoint) error {
	return nil
}
