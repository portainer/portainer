package libstack

import (
	"context"
	"testing"

	"github.com/docker/cli/cli/command"
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
