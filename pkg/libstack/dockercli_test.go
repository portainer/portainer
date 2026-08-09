package libstack

import (
	"context"
	"os"
	"path/filepath"
	"testing"

	"github.com/docker/cli/cli/command"
	"github.com/docker/cli/cli/config"
	configtypes "github.com/docker/cli/cli/config/types"
	"github.com/stretchr/testify/require"
)

func TestWithCli_InjectsHeaders(t *testing.T) {
	const headerName = "X-PortainerAgent-ManagerOperation"

	err := WithCli(
		t.Context(),
		DockerCliOptions{
			Host:    "tcp://127.0.0.1:1",
			Headers: map[string]string{headerName: "1"},
		},
		func(_ context.Context, cli *command.DockerCli) error {
			require.Equal(t, "1", cli.ConfigFile().HTTPHeaders[headerName])
			return nil
		},
	)
	require.NoError(t, err)
}

func TestWithCli_NoHeaders(t *testing.T) {
	err := WithCli(
		context.Background(),
		DockerCliOptions{Host: "tcp://127.0.0.1:1"},
		func(_ context.Context, cli *command.DockerCli) error {
			require.Empty(t, cli.ConfigFile().HTTPHeaders)
			return nil
		},
	)
	require.NoError(t, err)
}

func TestWithCli_PrunesStaleInlineRegistryAuthsWhenNoRegistriesAreProvided(t *testing.T) {
	configDir := tempDockerConfigDir(t, `{
	"auths": {
		"ghcr.io": {
			"auth": "dXNlcjpwYXNz"
		}
	}
}`)

	config.SetDir(configDir)

	err := WithCli(
		t.Context(),
		DockerCliOptions{},
		func(_ context.Context, cli *command.DockerCli) error {
			require.Empty(t, cli.ConfigFile().AuthConfigs)
			return nil
		},
	)
	require.NoError(t, err)
}

func TestWithCli_PrunesStaleInlineRegistryAuthsBeforeInjectingRegistries(t *testing.T) {
	configDir := tempDockerConfigDir(t, `{
	"auths": {
		"ghcr.io": {
			"auth": "dXNlcjpwYXNz"
		}
	}
}`)

	config.SetDir(configDir)

	err := WithCli(
		t.Context(),
		DockerCliOptions{
			Registries: []configtypes.AuthConfig{
				{
					Username:      "current-user",
					Password:      "current-password",
					ServerAddress: "registry.example.com",
				},
			},
		},
		func(_ context.Context, cli *command.DockerCli) error {
			require.NotContains(t, cli.ConfigFile().AuthConfigs, "ghcr.io")
			require.Contains(t, cli.ConfigFile().AuthConfigs, "registry.example.com")
			require.Equal(t, "current-user", cli.ConfigFile().AuthConfigs["registry.example.com"].Username)
			return nil
		},
	)
	require.NoError(t, err)
}

func tempDockerConfigDir(t *testing.T, configJSON string) string {
	t.Helper()

	configDir := t.TempDir()
	err := os.WriteFile(filepath.Join(configDir, "config.json"), []byte(configJSON), 0o644)
	require.NoError(t, err)

	return configDir
}
