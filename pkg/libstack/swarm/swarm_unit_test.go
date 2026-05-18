package swarm

import (
	"os"
	"slices"
	"testing"

	composetypes "github.com/docker/cli/cli/compose/types"
	configtypes "github.com/docker/cli/cli/config/types"
	"github.com/docker/docker/api/types/swarm"
	dockerregistry "github.com/docker/docker/registry"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/pkg/libstack"
	"github.com/stretchr/testify/require"
)

func Test_aggregateStatus(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name           string
		statuses       []libstack.Status
		expectedStatus libstack.Status
	}{
		{
			name:           "empty returns removed",
			statuses:       []libstack.Status{},
			expectedStatus: libstack.StatusRemoved,
		},
		{
			name:           "all running",
			statuses:       []libstack.Status{libstack.StatusRunning, libstack.StatusRunning},
			expectedStatus: libstack.StatusRunning,
		},
		{
			name:           "all completed",
			statuses:       []libstack.Status{libstack.StatusCompleted, libstack.StatusCompleted},
			expectedStatus: libstack.StatusCompleted,
		},
		{
			name:           "mix of running and completed",
			statuses:       []libstack.Status{libstack.StatusRunning, libstack.StatusCompleted},
			expectedStatus: libstack.StatusRunning,
		},
		{
			name:           "error takes priority",
			statuses:       []libstack.Status{libstack.StatusRunning, libstack.StatusError},
			expectedStatus: libstack.StatusError,
		},
		{
			name:           "starting takes priority over running",
			statuses:       []libstack.Status{libstack.StatusRunning, libstack.StatusStarting},
			expectedStatus: libstack.StatusStarting,
		},
		{
			name:           "removing",
			statuses:       []libstack.Status{libstack.StatusRemoving, libstack.StatusRunning},
			expectedStatus: libstack.StatusRemoving,
		},
		{
			name:           "all stopped",
			statuses:       []libstack.Status{libstack.StatusStopped, libstack.StatusStopped},
			expectedStatus: libstack.StatusStopped,
		},
		{
			name:           "all removed",
			statuses:       []libstack.Status{libstack.StatusRemoved, libstack.StatusRemoved},
			expectedStatus: libstack.StatusRemoved,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			require.Equal(t, tt.expectedStatus, aggregateStatus(tt.statuses))
		})
	}
}

func Test_isTerminalState(t *testing.T) {
	t.Parallel()

	tests := []struct {
		state    swarm.TaskState
		terminal bool
	}{
		{swarm.TaskStateNew, false},
		{swarm.TaskStateAllocated, false},
		{swarm.TaskStatePending, false},
		{swarm.TaskStateAssigned, false},
		{swarm.TaskStateAccepted, false},
		{swarm.TaskStatePreparing, false},
		{swarm.TaskStateReady, false},
		{swarm.TaskStateStarting, false},
		{swarm.TaskStateRunning, false},
		{swarm.TaskStateComplete, true},
		{swarm.TaskStateShutdown, true},
		{swarm.TaskStateFailed, true},
		{swarm.TaskStateRejected, true},
	}

	for _, tt := range tests {
		t.Run(string(tt.state), func(t *testing.T) {
			require.Equal(t, tt.terminal, isTerminalState(tt.state))
		})
	}
}

func Test_getServicesDeclaredNetworks(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name             string
		services         []composetypes.ServiceConfig
		expectedNetworks map[string]struct{}
	}{
		{
			name: "service with no networks gets default",
			services: []composetypes.ServiceConfig{
				{Name: "web", Networks: nil},
			},
			expectedNetworks: map[string]struct{}{"default": {}},
		},
		{
			name: "service with explicit network",
			services: []composetypes.ServiceConfig{
				{Name: "web", Networks: map[string]*composetypes.ServiceNetworkConfig{"mynet": nil}},
			},
			expectedNetworks: map[string]struct{}{"mynet": {}},
		},
		{
			name: "mix: one with networks, one without",
			services: []composetypes.ServiceConfig{
				{Name: "web", Networks: map[string]*composetypes.ServiceNetworkConfig{"mynet": nil}},
				{Name: "worker", Networks: nil},
			},
			expectedNetworks: map[string]struct{}{"mynet": {}, "default": {}},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := getServicesDeclaredNetworks(tt.services)
			require.Equal(t, tt.expectedNetworks, got)
		})
	}
}

func Test_encodeRegistryAuth(t *testing.T) {
	t.Parallel()

	dockerIORegistry := configtypes.AuthConfig{
		ServerAddress: dockerregistry.IndexServer,
		Username:      "user",
		Password:      "pass",
	}

	customRegistry := configtypes.AuthConfig{
		ServerAddress: "registry.example.com",
		Username:      "user",
		Password:      "pass",
	}

	tests := []struct {
		name         string
		image        string
		registries   []configtypes.AuthConfig
		expectedErr  string
		expectedAuth string
	}{
		{
			name:         "docker.io image with matching credentials",
			image:        "nginx:latest",
			registries:   []configtypes.AuthConfig{dockerIORegistry},
			expectedAuth: "eyJ1c2VybmFtZSI6InVzZXIiLCJwYXNzd29yZCI6InBhc3MiLCJzZXJ2ZXJhZGRyZXNzIjoiaHR0cHM6Ly9pbmRleC5kb2NrZXIuaW8vdjEvIn0=",
		},
		{
			name:       "docker.io image with no matching credentials",
			image:      "nginx:latest",
			registries: []configtypes.AuthConfig{},
		},
		{
			name:         "custom registry with matching credentials",
			image:        "registry.example.com/myimage:latest",
			registries:   []configtypes.AuthConfig{customRegistry},
			expectedAuth: "eyJ1c2VybmFtZSI6InVzZXIiLCJwYXNzd29yZCI6InBhc3MiLCJzZXJ2ZXJhZGRyZXNzIjoicmVnaXN0cnkuZXhhbXBsZS5jb20ifQ==",
		},
		{
			name:       "custom registry image with unrelated credentials",
			image:      "registry.example.com/myimage:latest",
			registries: []configtypes.AuthConfig{dockerIORegistry},
		},
		{
			name:        "invalid image reference returns error",
			image:       "@@invalid@@",
			expectedErr: "failed to parse image reference \"@@invalid@@\": invalid reference format",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := encodeRegistryAuth(tt.image, tt.registries)
			if err != nil {
				if tt.expectedErr == "" {
					t.Fatalf("expected no error but got: %v", err)
				}
				require.Contains(t, err.Error(), tt.expectedErr)
			} else {
				require.Equal(t, tt.expectedAuth, got)
			}
		})
	}
}

func Test_getConfig(t *testing.T) {
	dir := t.TempDir()

	writeFile := func(name, content string) string {
		path := filesystem.JoinPaths(dir, name)
		require.NoError(t, os.WriteFile(path, []byte(content), 0o644))
		return path
	}

	tests := []struct {
		name        string
		files       map[string]string
		workingDir  string
		env         []string
		osEnv       map[string]string
		expectedCfg *composetypes.Config
		expectedErr string
	}{
		{
			name: "valid compose file",
			files: map[string]string{
				"valid.yml": `version: '3'
services:
  web:
    image: nginx:latest`,
			},
			expectedCfg: &composetypes.Config{
				Filename: dir + "/valid.yml",
				Version:  "3.13",
				Services: composetypes.Services{
					composetypes.ServiceConfig{
						Name:        "web",
						Environment: composetypes.MappingWithEquals{},
						Image:       "nginx:latest",
					},
				},
				Networks: map[string]composetypes.NetworkConfig{},
				Volumes:  map[string]composetypes.VolumeConfig{},
				Secrets:  map[string]composetypes.SecretConfig{},
				Configs:  map[string]composetypes.ConfigObjConfig{},
			},
		},
		{
			name: "invalid YAML returns error",
			files: map[string]string{
				"invalid.yml": `not: valid: yaml: content`,
			},
			expectedErr: "failed to load compose file: yaml: mapping values are not allowed in this context",
		},
		{
			name:        "no file paths returns error",
			expectedErr: "failed to load compose file: at least one compose file must be specified",
		},
		{
			name: "service missing image returns error",
			files: map[string]string{
				"noimage.yml": `version: '3'
services:
  web:
    command: echo hello`,
			},
			expectedErr: "invalid image reference for service web: no image specified",
		},
		{
			name: "two compose files are merged",
			files: map[string]string{
				"base.yml": `version: '3'
services:
  web:
    image: nginx:latest`,
				"override.yml": `version: '3'
services:
  worker:
    image: alpine:latest`,
			},
			expectedCfg: &composetypes.Config{
				Filename: dir + "/base.yml",
				Version:  "3.13",
				Services: composetypes.Services{
					composetypes.ServiceConfig{
						Name:        "web",
						Environment: composetypes.MappingWithEquals{},
						Image:       "nginx:latest",
					},
					composetypes.ServiceConfig{
						Name:        "worker",
						Environment: composetypes.MappingWithEquals{},
						Image:       "alpine:latest",
					},
				},
				Networks: map[string]composetypes.NetworkConfig{},
				Volumes:  map[string]composetypes.VolumeConfig{},
				Secrets:  map[string]composetypes.SecretConfig{},
				Configs:  map[string]composetypes.ConfigObjConfig{},
			},
		},
		{
			name: "env var in image resolved from options env",
			files: map[string]string{
				"envvar.yml": `version: '3'
services:
  web:
    image: nginx:${TAG}`,
			},
			env: []string{"TAG=1.25"},
			expectedCfg: &composetypes.Config{
				Filename: dir + "/envvar.yml",
				Version:  "3.13",
				Services: composetypes.Services{
					composetypes.ServiceConfig{
						Name:        "web",
						Environment: composetypes.MappingWithEquals{},
						Image:       "nginx:1.25",
					},
				},
				Networks: map[string]composetypes.NetworkConfig{},
				Volumes:  map[string]composetypes.VolumeConfig{},
				Secrets:  map[string]composetypes.SecretConfig{},
				Configs:  map[string]composetypes.ConfigObjConfig{},
			},
		},
		{
			name: "PORTAINER_ prefixed env var from os.Environ is resolved",
			files: map[string]string{
				"portainerenv.yml": `version: '3'
services:
  web:
    image: nginx:${PORTAINER_TAG}`,
			},
			osEnv: map[string]string{
				libstack.PortainerEnvVarsPrefix + "TAG": "1.25",
			},
			expectedCfg: &composetypes.Config{
				Filename: dir + "/portainerenv.yml",
				Version:  "3.13",
				Services: composetypes.Services{
					composetypes.ServiceConfig{
						Name:        "web",
						Environment: composetypes.MappingWithEquals{},
						Image:       "nginx:1.25",
					},
				},
				Networks: map[string]composetypes.NetworkConfig{},
				Volumes:  map[string]composetypes.VolumeConfig{},
				Secrets:  map[string]composetypes.SecretConfig{},
				Configs:  map[string]composetypes.ConfigObjConfig{},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			filePaths := make([]string, 0, len(tt.files))
			for filename, content := range tt.files {
				filePaths = append(filePaths, writeFile(filename, content))
			}
			slices.Sort(filePaths)

			for k, v := range tt.osEnv {
				t.Setenv(k, v)
			}

			cfg, err := getConfig(filePaths, tt.workingDir, tt.env)
			if err != nil {
				if tt.expectedErr == "" {
					t.Fatalf("expected no error but got: %v", err)
				}
				require.Contains(t, err.Error(), tt.expectedErr)
			} else {
				require.Equal(t, tt.expectedCfg, cfg)
			}
		})
	}
}
