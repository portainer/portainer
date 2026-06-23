package swarm

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/api/types/swarm"
	"github.com/docker/docker/client"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/pkg/libstack"
	"github.com/stretchr/testify/require"
)

// ensureSwarmMode ensures the Docker daemon is a swarm manager for the duration
// of the test. If the daemon is inactive, it initialises a single-node swarm and
// registers a cleanup to leave it afterwards. If the daemon is already a manager
// it does nothing. If the daemon is a worker it fails the test immediately.
func ensureSwarmMode(t *testing.T) *client.Client {
	t.Helper()

	apiClient, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	require.NoError(t, err)
	t.Cleanup(func() { require.NoError(t, apiClient.Close()) })

	info, err := apiClient.Info(t.Context())
	require.NoError(t, err)

	switch info.Swarm.LocalNodeState {
	case swarm.LocalNodeStateInactive:
		_, err = apiClient.SwarmInit(t.Context(), swarm.InitRequest{
			ListenAddr:    "0.0.0.0:2377",
			AdvertiseAddr: "127.0.0.1",
		})
		require.NoError(t, err)
		t.Cleanup(func() { require.NoError(t, apiClient.SwarmLeave(context.Background(), true)) })
	case swarm.LocalNodeStateActive:
		if !info.Swarm.ControlAvailable {
			t.Fatal("docker daemon is a swarm worker, not a manager: cannot run swarm stack tests")
		}
		// already a manager - don't tear down, don't disrupt
	default:
		t.Fatalf("unexpected swarm node state: %s", info.Swarm.LocalNodeState)
	}

	return apiClient
}

// serviceExists reports whether a service named <stackName>_<serviceName> exists.
func serviceExists(t *testing.T, apiClient client.APIClient, stackName, serviceName string) bool {
	fullName := stackName + "_" + serviceName

	services, err := apiClient.ServiceList(t.Context(), swarm.ServiceListOptions{
		Filters: filters.NewArgs(filters.KeyValuePair{Key: "name", Value: fullName}),
	})
	require.NoError(t, err)

	for _, svc := range services {
		if svc.Spec.Name == fullName {
			return true
		}
	}

	return false
}

func createComposeFile(t *testing.T, dir, name, content string) string {
	t.Helper()

	path := filesystem.JoinPaths(dir, name)
	require.NoError(t, os.WriteFile(path, []byte(content), 0o644))

	return path
}

func TestSwarmValidate(t *testing.T) {
	ensureIntegrationTest(t)

	deployer := NewSwarmDeployer()
	dir := t.TempDir()

	testCases := []struct {
		name          string
		composeFile   string
		expectedError string
	}{
		{
			name: "valid compose file",
			composeFile: `version: '3'
services:
  web:
    image: nginx:latest`,
			expectedError: "",
		},
		{
			name:          "invalid YAML returns error",
			composeFile:   "not valid yaml content",
			expectedError: "failed to load compose file: top-level object must be a mapping",
		},
		{
			name: "missing image returns error",
			composeFile: `version: '3'
services:
  web:
    command: echo hello`,
			expectedError: "invalid image reference for service web: no image specified",
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			path := createComposeFile(t, dir, "docker-compose.yml", testCase.composeFile)
			err := deployer.Validate(t.Context(), []string{path}, Options{})
			var gotError string
			if err != nil {
				gotError = err.Error()
			}

			if gotError != "" && testCase.expectedError == "" {
				t.Fatalf("expected no error but got: %v", err)
			}
			require.Contains(t, gotError, testCase.expectedError)
		})
	}
}

func TestSwarmDeployWithRemoveOrphans(t *testing.T) {
	ensureIntegrationTest(t)

	apiClient := ensureSwarmMode(t)

	const projectName = "swarm_orphan_test"

	const twoServiceContent = `version: '3'
services:
  service-1:
    image: alpine:latest
    command: ["sh", "-c", "while true; do sleep 3600; done"]
  service-2:
    image: alpine:latest
    command: ["sh", "-c", "while true; do sleep 3600; done"]`

	const oneServiceContent = `version: '3'
services:
  service-2:
    image: alpine:latest
    command: ["sh", "-c", "while true; do sleep 3600; done"]`

	deployer := NewSwarmDeployer()
	dir := t.TempDir()

	twoServicePath := createComposeFile(t, dir, "two-services.yml", twoServiceContent)
	oneServicePath := createComposeFile(t, dir, "one-service.yml", oneServiceContent)

	err := deployer.Deploy(
		t.Context(),
		[]string{twoServicePath},
		DeployOptions{Options: Options{ProjectName: projectName}},
	)
	require.NoError(t, err)

	t.Cleanup(func() {
		err := deployer.Remove(context.Background(), projectName, RemoveOptions{})
		require.NoError(t, err)
	})

	ctx, cancel := context.WithTimeout(t.Context(), time.Minute)
	t.Cleanup(func() { cancel() })

	result := deployer.WaitForStatus(ctx, projectName, Options{}, libstack.StatusRunning)
	require.Empty(t, result.ErrorMsg)
	require.Equal(t, libstack.StatusRunning, result.Status)

	require.True(t, serviceExists(t, apiClient, projectName, "service-1"))
	require.True(t, serviceExists(t, apiClient, projectName, "service-2"))

	err = deployer.Deploy(ctx, []string{oneServicePath}, DeployOptions{
		Options:       Options{ProjectName: projectName},
		RemoveOrphans: true,
	})
	require.NoError(t, err)

	result = deployer.WaitForStatus(ctx, projectName, Options{}, libstack.StatusRunning)
	require.Empty(t, result.ErrorMsg)
	require.Equal(t, libstack.StatusRunning, result.Status)

	require.False(t, serviceExists(t, apiClient, projectName, "service-1"))
	require.True(t, serviceExists(t, apiClient, projectName, "service-2"))
}

func TestSwarmDeployWithEnvVars(t *testing.T) {
	ensureIntegrationTest(t)
	ensureSwarmMode(t)

	const projectName = "swarm_envvar_test"

	const composeContent = `version: '3'
services:
  web:
    image: alpine:${TAG}
    command: ["sh", "-c", "while true; do sleep 3600; done"]`

	deployer := NewSwarmDeployer()
	dir := t.TempDir()

	path := createComposeFile(t, dir, "envvar.yml", composeContent)

	err := deployer.Deploy(t.Context(), []string{path}, DeployOptions{
		Options: Options{
			ProjectName: projectName,
			Env:         []string{"TAG=latest"},
		},
	})
	require.NoError(t, err)

	t.Cleanup(func() {
		err := deployer.Remove(context.Background(), projectName, RemoveOptions{})
		require.NoError(t, err)
	})

	ctx, cancel := context.WithTimeout(t.Context(), time.Minute)
	t.Cleanup(func() { cancel() })

	result := deployer.WaitForStatus(ctx, projectName, Options{}, libstack.StatusRunning)
	require.Empty(t, result.ErrorMsg)
	require.Equal(t, libstack.StatusRunning, result.Status)
}
