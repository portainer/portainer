package deployments

import (
	"os"
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	dockerclient "github.com/portainer/portainer/api/docker/client"
	"github.com/portainer/portainer/api/filesystem"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/portainer/portainer/api/scheduler"

	"github.com/stretchr/testify/require"
)

const bindMountCompose = "services:\n  web:\n    image: alpine\n    volumes:\n      - /:/host\n"

type signalGitService struct {
	portainer.GitService
	called chan struct{}
}

func (s *signalGitService) LatestCommitID(repositoryURL, referenceName, username, password string, authType gittypes.GitCredentialAuthType, tlsSkipVerify bool) (string, error) {
	select {
	case s.called <- struct{}{}:
	default:
	}

	return s.GitService.LatestCommitID(repositoryURL, referenceName, username, password, authType, tlsSkipVerify)
}

type signalDeployer struct {
	noopDeployer
	called chan struct{}
}

func (s signalDeployer) GetDockerClientFactory() *dockerclient.ClientFactory {
	select {
	case s.called <- struct{}{}:
	default:
	}

	return nil
}

func newBindMountStack(t *testing.T, store *datastore.Store) *portainer.Stack {
	t.Helper()

	err := store.Endpoint().Create(&portainer.Endpoint{ID: 1})
	require.NoError(t, err)

	err = store.User().Create(&portainer.User{ID: 2, Username: "user", Role: portainer.StandardUserRole})
	require.NoError(t, err)

	projectPath := t.TempDir()
	err = os.WriteFile(filesystem.JoinPaths(projectPath, "docker-compose.yml"), []byte(bindMountCompose), 0o600)
	require.NoError(t, err)

	stack := &portainer.Stack{
		ID:          1,
		EndpointID:  1,
		Type:        portainer.DockerComposeStack,
		Name:        "evil",
		ProjectPath: projectPath,
		EntryPoint:  "docker-compose.yml",
		CreatedBy:   "user",
		GitConfig:   &gittypes.RepoConfig{URL: "url", ReferenceName: "ref", ConfigHash: "oldHash"},
	}

	err = store.Stack().Create(stack)
	require.NoError(t, err)

	return stack
}

func Test_RedeployWhenChanged_NonAdminBindMountIsRejected(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, true, true)

	fileService, err := filesystem.NewService(t.TempDir(), "")
	require.NoError(t, err)

	newBindMountStack(t, store)

	err = RedeployWhenChanged(1, noopDeployer{}, store, testhelpers.NewGitService(nil, "newHash"), fileService)
	require.ErrorContains(t, err, "bind-mount disabled for non administrator users")
}

func Test_RedeployWhenChanged_WebhookRunsValidationInBackground(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, true, true)

	fileService, err := filesystem.NewService(t.TempDir(), "")
	require.NoError(t, err)

	stack := newBindMountStack(t, store)
	stack.AutoUpdate = &portainer.AutoUpdateSettings{Webhook: "6a8ed3f2-2f4b-4a8c-a6c4-3bb7b1d6c0a1"}
	err = store.Stack().Update(stack.ID, stack)
	require.NoError(t, err)

	deployer := signalDeployer{called: make(chan struct{}, 1)}

	// The webhook returns immediately and the validation failure is only logged
	err = RedeployWhenChanged(1, deployer, store, testhelpers.NewGitService(nil, "newHash"), fileService)
	require.NoError(t, err)

	select {
	case <-deployer.called:
	case <-time.After(10 * time.Second):
		require.Fail(t, "the webhook goroutine never validated the stack")
	}

	time.Sleep(100 * time.Millisecond)
}

func Test_StartStackSchedules_RunsRedeployJob(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, true, true)

	err := store.Endpoint().Create(&portainer.Endpoint{ID: 1})
	require.NoError(t, err)

	err = store.User().Create(&portainer.User{ID: 1, Username: "admin", Role: portainer.AdministratorRole})
	require.NoError(t, err)

	err = store.Stack().Create(&portainer.Stack{
		ID:          1,
		EndpointID:  1,
		CreatedBy:   "admin",
		ProjectPath: t.TempDir(),
		AutoUpdate:  &portainer.AutoUpdateSettings{Interval: "1s"},
		GitConfig:   &gittypes.RepoConfig{URL: "url", ReferenceName: "ref", ConfigHash: "oldHash"},
	})
	require.NoError(t, err)

	s := scheduler.NewScheduler(t.Context())

	t.Cleanup(func() {
		err := s.Shutdown()
		require.NoError(t, err)
	})

	gitService := &signalGitService{GitService: testhelpers.NewGitService(nil, "oldHash"), called: make(chan struct{}, 1)}

	err = StartStackSchedules(s, noopDeployer{}, store, gitService, nil)
	require.NoError(t, err)

	select {
	case <-gitService.called:
	case <-time.After(10 * time.Second):
		require.Fail(t, "the scheduled job never ran")
	}

	stack, err := store.Stack().Read(1)
	require.NoError(t, err)
	require.NotEmpty(t, stack.AutoUpdate.JobID)

	// An unparsable interval aborts the schedule setup
	stack.AutoUpdate.Interval = "not-a-duration"
	err = store.Stack().Update(stack.ID, stack)
	require.NoError(t, err)

	err = StartStackSchedules(s, noopDeployer{}, store, gitService, nil)
	require.ErrorContains(t, err, "Unable to parse auto update interval")
}

func Test_DeploymentConfigs_NonAdminBindMountIsRejected(t *testing.T) {
	t.Parallel()

	fileService, err := filesystem.NewService(t.TempDir(), "")
	require.NoError(t, err)

	projectPath := t.TempDir()
	err = os.WriteFile(filesystem.JoinPaths(projectPath, "docker-compose.yml"), []byte(bindMountCompose), 0o600)
	require.NoError(t, err)

	stack := &portainer.Stack{Name: "evil", ProjectPath: projectPath, EntryPoint: "docker-compose.yml", Type: portainer.DockerComposeStack}
	endpoint := &portainer.Endpoint{ID: 1}
	user := &portainer.User{ID: 2, Role: portainer.StandardUserRole}

	// Compose
	compose := &ComposeStackDeploymentConfig{stack: stack, endpoint: endpoint, user: user, FileService: fileService, StackDeployer: noopDeployer{}}
	err = compose.Deploy()
	require.ErrorContains(t, err, "bind-mount disabled for non administrator users")

	// Swarm
	swarm := &SwarmStackDeploymentConfig{stack: stack, endpoint: endpoint, user: user, FileService: fileService, StackDeployer: noopDeployer{}}
	err = swarm.Deploy()
	require.ErrorContains(t, err, "bind-mount disabled for non administrator users")
}
