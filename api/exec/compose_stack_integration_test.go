package exec

import (
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/pkg/libstack/compose"
	"github.com/portainer/portainer/pkg/testhelpers"
	"github.com/stretchr/testify/require"

	"github.com/rs/zerolog/log"
)

const composeFile = `version: "3.9"
services:
  busybox:
    image: "alpine:latest"
    container_name: "compose_wrapper_test"`
const composedContainerName = "compose_wrapper_test"

func setup(t *testing.T) (*portainer.Stack, *portainer.Endpoint) {
	dir := t.TempDir()
	composeFileName := "compose_wrapper_test.yml"
	f, err := os.Create(filepath.Join(dir, composeFileName))
	require.NoError(t, err)

	_, err = f.WriteString(composeFile)
	require.NoError(t, err)

	stack := &portainer.Stack{
		ProjectPath: dir,
		EntryPoint:  composeFileName,
		Name:        "project-name",
	}

	return stack, &portainer.Endpoint{URL: "unix://"}
}

func Test_UpAndDown(t *testing.T) {
	testhelpers.IntegrationTest(t)

	stack, endpoint := setup(t)

	deployer := compose.NewComposeDeployer()

	w := NewComposeStackManager(deployer, nil, nil)

	ctx := context.TODO()

	if err := w.Up(ctx, stack, endpoint, portainer.ComposeUpOptions{}); err != nil {
		t.Fatalf("Error calling docker-compose up: %s", err)
	}

	if !containerExists(composedContainerName) {
		t.Fatal("container should exist")
	}

	if err := w.Down(ctx, stack, endpoint); err != nil {
		t.Fatalf("Error calling docker-compose down: %s", err)
	}

	if containerExists(composedContainerName) {
		t.Fatal("container should be removed")
	}
}

func containerExists(containerName string) bool {
	cmd := exec.Command("docker", "ps", "-a", "-f", "name="+containerName)

	out, err := cmd.Output()
	if err != nil {
		log.Fatal().Err(err).Msg("failed to list containers")
	}

	return strings.Contains(string(out), containerName)
}
