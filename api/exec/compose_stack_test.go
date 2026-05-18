package exec

import (
	"io"
	"os"
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/filesystem"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_createEnvFile(t *testing.T) {
	t.Parallel()
	dir := t.TempDir()

	tests := []struct {
		name         string
		stack        *portainer.Stack
		expected     string
		expectedFile bool
	}{
		{
			name: "should not add env file option if stack doesn't have env variables",
			stack: &portainer.Stack{
				ProjectPath: dir,
				Env:         nil,
			},
			expected: "",
		},
		{
			name: "should not add env file option if stack's env variables are empty",
			stack: &portainer.Stack{
				ProjectPath: dir,
				Env:         []portainer.Pair{},
			},
			expected: "",
		},
		{
			name: "should add env file option if stack has env variables",
			stack: &portainer.Stack{
				ProjectPath: dir,
				Env: []portainer.Pair{
					{Name: "var1", Value: "value1"},
					{Name: "var2", Value: "value2"},
				},
			},
			expected: "var1=value1\nvar2=value2\n",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, _ := createEnvFile(tt.stack)

			if tt.expected != "" {
				assert.Equal(t, filesystem.JoinPaths(tt.stack.ProjectPath, "stack.env"), result)

				f, _ := os.Open(filesystem.JoinPaths(dir, "stack.env"))
				content, _ := io.ReadAll(f)

				assert.Equal(t, tt.expected, string(content))
			} else {
				assert.Empty(t, result)
			}
		})
	}
}

func Test_createEnvFile_mergesDefultAndInplaceEnvVars(t *testing.T) {
	t.Parallel()
	dir := t.TempDir()
	err := os.WriteFile(filesystem.JoinPaths(dir, ".env"), []byte("VAR1=VAL1\nVAR2=VAL2\n"), 0600)
	require.NoError(t, err)

	stack := &portainer.Stack{
		ProjectPath: dir,
		Env: []portainer.Pair{
			{Name: "VAR1", Value: "NEW_VAL1"},
			{Name: "VAR3", Value: "VAL3"},
		},
	}
	result, err := createEnvFile(stack)
	assert.Equal(t, filesystem.JoinPaths(stack.ProjectPath, "stack.env"), result)
	require.NoError(t, err)
	assert.FileExists(t, filesystem.JoinPaths(dir, "stack.env"))

	f, err := os.Open(filesystem.JoinPaths(dir, "stack.env"))
	require.NoError(t, err)

	content, err := io.ReadAll(f)
	require.NoError(t, err)

	assert.Equal(t, []byte("VAR1=VAL1\nVAR2=VAL2\n\nVAR1=NEW_VAL1\nVAR3=VAL3\n"), content)
}

func Test_portainerRegistriesToAuthConfigs(t *testing.T) {
	t.Parallel()

	t.Run("returns empty slice for empty input", func(t *testing.T) {
		t.Parallel()
		result := portainerRegistriesToAuthConfigs([]portainer.Registry{})
		require.Nil(t, result)
	})

	t.Run("uses registry URL, username and password for non-authenticated registry", func(t *testing.T) {
		t.Parallel()
		registries := []portainer.Registry{
			{URL: "registry.example.com", Username: "user", Password: "pass", Authentication: false},
		}
		result := portainerRegistriesToAuthConfigs(registries)
		require.Len(t, result, 1)
		require.Equal(t, "registry.example.com", result[0].ServerAddress)
		require.Equal(t, "user", result[0].Username)
		require.Equal(t, "pass", result[0].Password)
	})

	t.Run("uses username and password for authenticated non-ECR registry", func(t *testing.T) {
		t.Parallel()
		registries := []portainer.Registry{
			{URL: "registry.example.com", Username: "user", Password: "pass", Authentication: true, Type: portainer.CustomRegistry},
		}
		result := portainerRegistriesToAuthConfigs(registries)
		require.Len(t, result, 1)
		require.Equal(t, "user", result[0].Username)
		require.Equal(t, "pass", result[0].Password)
	})

	t.Run("parses ECR access token for authenticated ECR registry with valid token", func(t *testing.T) {
		t.Parallel()
		registries := []portainer.Registry{
			{
				URL:               "123456789.dkr.ecr.us-east-1.amazonaws.com",
				Username:          "AKIAIOSFODNN7EXAMPLE",
				Password:          "secretkey",
				Authentication:    true,
				Type:              portainer.EcrRegistry,
				Ecr:               portainer.EcrData{Region: "us-east-1"},
				AccessToken:       "AWS:ecr-password",
				AccessTokenExpiry: time.Now().Add(time.Hour).Unix(),
			},
		}
		result := portainerRegistriesToAuthConfigs(registries)
		require.Len(t, result, 1)
		require.Equal(t, "AWS", result[0].Username)
		require.Equal(t, "ecr-password", result[0].Password)
	})

	t.Run("includes valid registries and skips ones with credential errors", func(t *testing.T) {
		t.Parallel()
		registries := []portainer.Registry{
			{URL: "valid.example.com", Username: "user", Password: "pass", Authentication: false},
			{
				URL:               "123456789.dkr.ecr.us-east-1.amazonaws.com",
				Authentication:    true,
				Type:              portainer.EcrRegistry,
				Ecr:               portainer.EcrData{Region: "us-east-1"},
				AccessToken:       "no-colon-token",
				AccessTokenExpiry: time.Now().Add(time.Hour).Unix(),
			},
		}
		result := portainerRegistriesToAuthConfigs(registries)
		require.Len(t, result, 1)
		require.Equal(t, "valid.example.com", result[0].ServerAddress)
	})
}
