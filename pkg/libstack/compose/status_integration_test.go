package compose

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/portainer/portainer/pkg/libstack"
)

/*

1. starting = docker compose file that runs several services, one of them should be with status starting
2. running = docker compose file that runs successfully and returns status running
3. removing = run docker compose config, remove the stack, and return removing status
4. failed = run a valid docker compose file, but one of the services should fail to start (so "docker compose up" should run successfully, but one of the services should do something like `CMD ["exit", "1"]
5. removed = remove a compose stack and return status removed

*/

func ensureIntegrationTest(t *testing.T) {
	if _, ok := os.LookupEnv("INTEGRATION_TEST"); !ok {
		t.Skip("skip an integration test")
	}
}

func TestComposeProjectStatus(t *testing.T) {
	ensureIntegrationTest(t)

	testCases := []struct {
		TestName              string
		ComposeFile           string
		ExpectedStatus        libstack.Status
		ExpectedStatusMessage bool
	}{

		{
			TestName:       "running",
			ComposeFile:    "status_test_files/running.yml",
			ExpectedStatus: libstack.StatusRunning,
		},

		{
			TestName:              "failed",
			ComposeFile:           "status_test_files/failed.yml",
			ExpectedStatus:        libstack.StatusError,
			ExpectedStatusMessage: true,
		},
	}

	w := NewComposeDeployer()
	ctx := context.Background()

	for _, testCase := range testCases {
		t.Run(testCase.TestName, func(t *testing.T) {
			projectName := testCase.TestName
			err := w.Deploy(ctx, []string{testCase.ComposeFile}, libstack.DeployOptions{
				Options: libstack.Options{
					ProjectName: projectName,
				},
			})
			if err != nil {
				t.Fatalf("[test: %s] Failed to deploy compose file: %v", testCase.TestName, err)
			}

			time.Sleep(5 * time.Second)

			status, statusMessage, err := waitForStatus(w, ctx, projectName, libstack.StatusRunning)
			if err != nil {
				t.Fatalf("[test: %s] Failed to get compose project status: %v", testCase.TestName, err)
			}

			if status != testCase.ExpectedStatus {
				t.Fatalf("[test: %s] Expected status: %s, got: %s", testCase.TestName, testCase.ExpectedStatus, status)
			}

			if testCase.ExpectedStatusMessage && statusMessage == "" {
				t.Fatalf("[test: %s] Expected status message but got empty", testCase.TestName)
			}

			err = w.Remove(ctx, projectName, nil, libstack.RemoveOptions{})
			if err != nil {
				t.Fatalf("[test: %s] Failed to remove compose project: %v", testCase.TestName, err)
			}

			time.Sleep(20 * time.Second)

			status, statusMessage, err = waitForStatus(w, ctx, projectName, libstack.StatusRemoved)
			if err != nil {
				t.Fatalf("[test: %s] Failed to get compose project status: %v", testCase.TestName, err)
			}

			if status != libstack.StatusRemoved {
				t.Fatalf("[test: %s] Expected stack to be removed, got %s", testCase.TestName, status)
			}

			if statusMessage != "" {
				t.Fatalf("[test: %s] Expected empty status message: %s, got: %s", "", testCase.TestName, statusMessage)
			}
		})
	}
}

func waitForStatus(deployer libstack.Deployer, ctx context.Context, stackName string, requiredStatus libstack.Status) (libstack.Status, string, error) {
	ctx, cancel := context.WithTimeout(ctx, 1*time.Minute)
	defer cancel()

	result := deployer.WaitForStatus(ctx, stackName, requiredStatus)
	if result.ErrorMsg == "" {
		return result.Status, "", nil
	}

	return libstack.StatusError, result.ErrorMsg, nil
}
