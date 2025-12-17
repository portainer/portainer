package exec

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestConfigFilePaths(t *testing.T) {
	args := []string{"stack", "deploy", "--with-registry-auth"}
	filePaths := []string{"dir/file", "dir/file-two", "dir/file-three"}
	expected := []string{"stack", "deploy", "--with-registry-auth", "--compose-file", "dir/file", "--compose-file", "dir/file-two", "--compose-file", "dir/file-three"}
	output := configureFilePaths(args, filePaths)
	assert.ElementsMatch(t, expected, output, "wrong output file paths")
}

func TestPrepareDockerCommandAndArgs(t *testing.T) {
	binaryPath := "/test/dist"
	configPath := "/test/config"
	manager := &SwarmStackManager{
		binaryPath: binaryPath,
		configPath: configPath,
	}

	endpoint := &portainer.Endpoint{
		URL: "tcp://test:9000",
		TLSConfig: portainer.TLSConfiguration{
			TLS:           true,
			TLSSkipVerify: true,
		},
	}

	command, args, err := manager.prepareDockerCommandAndArgs(binaryPath, configPath, endpoint)
	require.NoError(t, err)

	expectedCommand := "/test/dist/docker"
	expectedArgs := []string{"--config", "/test/config", "-H", "tcp://test:9000", "--tls", "--tlscacert", ""}

	require.Equal(t, expectedCommand, command)
	require.Equal(t, expectedArgs, args)
}
