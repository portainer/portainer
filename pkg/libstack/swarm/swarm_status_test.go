package swarm

import (
	"context"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/portainer/portainer/api/filesystem"
	libstack "github.com/portainer/portainer/pkg/libstack"
	"github.com/stretchr/testify/require"
)

func ensureIntegrationTest(t *testing.T) {
	t.Helper()

	if _, ok := os.LookupEnv("INTEGRATION_TEST"); !ok {
		t.Skip("skip an integration test")
	}
}

func TestSwarmProjectStatus(t *testing.T) {
	ensureIntegrationTest(t)

	testCases := []struct {
		TestName              string
		FileContent           string
		ExpectedStatus        libstack.Status
		ExpectedStatusMessage string
	}{
		{
			TestName: "running",
			FileContent: `version: '3'
services:
  web:
    image: nginx:latest`,
			ExpectedStatus: libstack.StatusRunning,
		},
		{
			TestName: "failed",
			FileContent: `version: '3'
services:
  failing:
    image: alpine:latest
    command: ["sh", "-c", "exit 1"]`,
			ExpectedStatus:        libstack.StatusError,
			ExpectedStatusMessage: "task: non-zero exit (1)",
		},
	}

	ensureSwarmMode(t)

	deployer := NewSwarmDeployer()
	dir := t.TempDir()

	for _, testCase := range testCases {
		t.Run(testCase.TestName, func(t *testing.T) {
			projectName := testCase.TestName

			composeFileName := fmt.Sprintf("docker-compose-%s.yml", projectName)
			composeFilePath := filesystem.JoinPaths(dir, composeFileName)

			f, err := os.Create(composeFilePath)
			require.NoError(t, err, "failed to create compose file")

			_, err = f.WriteString(testCase.FileContent)
			require.NoError(t, err, "failed to write compose file")

			err = deployer.Deploy(
				t.Context(),
				[]string{composeFilePath},
				DeployOptions{Options: Options{ProjectName: projectName}},
			)
			require.NoError(t, err, "failed to deploy stack")
			t.Cleanup(func() {
				err := deployer.Remove(context.Background(), projectName, RemoveOptions{})
				require.NoError(t, err, "failed to remove stack")

				result := waitForSwarmStatus(t, deployer, projectName, libstack.StatusRemoved)

				require.Equal(
					t,
					libstack.StatusRemoved,
					result.Status,
					"expected stack to be removed, got %s (err: %s)",
					result.Status,
					result.ErrorMsg,
				)
			})

			result := waitForSwarmStatus(t, deployer, projectName, testCase.ExpectedStatus)

			require.Equal(t, testCase.ExpectedStatus, result.Status, "unexpected status. Error message: %v", result.ErrorMsg)
			require.Equal(t, testCase.ExpectedStatusMessage, result.ErrorMsg)
		})
	}
}

func waitForSwarmStatus(
	t *testing.T,
	deployer *SwarmDeployer,
	projectName string,
	status libstack.Status,
) libstack.WaitResult {
	t.Helper()

	ctx, cancel := context.WithTimeout(t.Context(), time.Minute)
	defer cancel()

	return deployer.WaitForStatus(ctx, projectName, Options{}, status)
}
