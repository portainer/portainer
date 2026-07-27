package stackutils

import (
	"os"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/stretchr/testify/require"
)

func TestBuildEnvMap_Priority(t *testing.T) {
	t.Setenv("HOST_PORT", "1111")

	tmpDir := t.TempDir()
	err := os.WriteFile(filesystem.JoinPaths(tmpDir, ".env"), []byte("HOST_PORT=2222\n"), 0o600)
	require.NoError(t, err)

	stack := &portainer.Stack{
		ProjectPath: tmpDir,
		EntryPoint:  "docker-compose.yml",
		Env:         []portainer.Pair{{Name: "HOST_PORT", Value: "3333"}},
	}

	env, err := BuildEnvMap(stack)
	require.NoError(t, err)
	require.Equal(t, "3333", env["HOST_PORT"])
}

func TestBuildEnvMap_EmptyStackEnv(t *testing.T) {
	t.Setenv("HOST_PORT", "1111")

	stack := &portainer.Stack{
		ProjectPath: t.TempDir(),
		EntryPoint:  "docker-compose.yml",
	}

	env, err := BuildEnvMap(stack)
	require.NoError(t, err)
	require.Equal(t, "1111", env["HOST_PORT"])
}

func TestBuildEnvMap_VariableExpansionFromOSEnv(t *testing.T) {
	t.Setenv("HOST_PORT", "3000")

	stack := &portainer.Stack{
		ProjectPath: t.TempDir(),
		EntryPoint:  "docker-compose.yml",
		Env:         []portainer.Pair{{Name: "GREETING", Value: "port-is-${HOST_PORT}"}},
	}

	env, err := BuildEnvMap(stack)
	require.NoError(t, err)
	require.Equal(t, "port-is-3000", env["GREETING"])
}

func TestBuildEnvMap_QuotedValue(t *testing.T) {
	stack := &portainer.Stack{
		ProjectPath: t.TempDir(),
		EntryPoint:  "docker-compose.yml",
		Env:         []portainer.Pair{{Name: "API_PORT", Value: `"8005"`}},
	}

	env, err := BuildEnvMap(stack)
	require.NoError(t, err)
	require.Equal(t, "8005", env["API_PORT"])
}

func TestBuildEnvMap_InvalidStackEnv_ReturnsError(t *testing.T) {
	stack := &portainer.Stack{
		ProjectPath: t.TempDir(),
		EntryPoint:  "docker-compose.yml",
		Env:         []portainer.Pair{{Name: "API_PORT", Value: `"unterminated`}},
	}

	env, err := BuildEnvMap(stack)
	require.ErrorContains(t, err, "failed to parse stack environment variables")
	require.Nil(t, env)
}
