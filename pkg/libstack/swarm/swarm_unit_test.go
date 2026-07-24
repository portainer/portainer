package swarm

import (
	"context"
	"os"
	"path/filepath"
	"slices"
	"testing"

	"github.com/docker/cli/cli/compose/convert"
	composetypes "github.com/docker/cli/cli/compose/types"
	configtypes "github.com/docker/cli/cli/config/types"
	"github.com/docker/docker/api/types/swarm"
	"github.com/docker/docker/client"
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

func Test_cliOptions(t *testing.T) {
	t.Parallel()

	registries := []configtypes.AuthConfig{
		{ServerAddress: "registry.example.com", Username: "user", Password: "pass"},
		{ServerAddress: dockerregistry.IndexServer, Username: "other"},
	}

	tests := []struct {
		name       string
		host       string
		registries []configtypes.AuthConfig
		expected   libstack.DockerCliOptions
	}{
		{
			name:       "sets manager-operation header and passes through host and registries",
			host:       "tcp://127.0.0.1:2377",
			registries: registries,
			expected: libstack.DockerCliOptions{
				Host:       "tcp://127.0.0.1:2377",
				Registries: registries,
				Headers:    map[string]string{ManagerOperationHeader: "1"},
			},
		},
		{
			name: "empty host and nil registries still set the header",
			expected: libstack.DockerCliOptions{
				Headers: map[string]string{ManagerOperationHeader: "1"},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			require.Equal(t, tt.expected, cliOptions(tt.host, tt.registries))
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

func Test_normalizeRegistryServerAddresses(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name             string
		registries       []configtypes.AuthConfig
		expectedReturned []configtypes.AuthConfig
	}{
		{
			name:             "empty ServerAddress is normalized to IndexServer",
			registries:       []configtypes.AuthConfig{{ServerAddress: "", Username: "user"}},
			expectedReturned: []configtypes.AuthConfig{{ServerAddress: dockerregistry.IndexServer, Username: "user"}},
		},
		{
			name:             "docker.io default namespace is normalized to IndexServer",
			registries:       []configtypes.AuthConfig{{ServerAddress: dockerregistry.DefaultNamespace, Username: "user"}},
			expectedReturned: []configtypes.AuthConfig{{ServerAddress: dockerregistry.IndexServer, Username: "user"}},
		},
		{
			name:             "custom registry address is left untouched",
			registries:       []configtypes.AuthConfig{{ServerAddress: "registry.example.com", Username: "user"}},
			expectedReturned: []configtypes.AuthConfig{{ServerAddress: "registry.example.com", Username: "user"}},
		},
		{
			name:             "IndexServer address is left untouched",
			registries:       []configtypes.AuthConfig{{ServerAddress: dockerregistry.IndexServer, Username: "user"}},
			expectedReturned: []configtypes.AuthConfig{{ServerAddress: dockerregistry.IndexServer, Username: "user"}},
		},
		{
			name: "mix of registries normalizes only the matching ones",
			registries: []configtypes.AuthConfig{
				{ServerAddress: "", Username: "empty"},
				{ServerAddress: dockerregistry.DefaultNamespace, Username: "default-namespace"},
				{ServerAddress: "registry.example.com", Username: "custom"},
			},
			expectedReturned: []configtypes.AuthConfig{
				{ServerAddress: dockerregistry.IndexServer, Username: "empty"},
				{ServerAddress: dockerregistry.IndexServer, Username: "default-namespace"},
				{ServerAddress: "registry.example.com", Username: "custom"},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			original := slices.Clone(tt.registries)

			got := normalizeRegistryServerAddresses(tt.registries)

			require.Equal(t, tt.expectedReturned, got)
			require.Equal(t, original, tt.registries, "input slice must not be mutated")
		})
	}
}

func Test_getConfig(t *testing.T) {
	dir := t.TempDir()

	writeFile := func(name, content string) string {
		path := filesystem.JoinPaths(dir, name)
		require.NoError(t, os.MkdirAll(filepath.Dir(path), 0o755))
		require.NoError(t, os.WriteFile(path, []byte(content), 0o644))
		return path
	}

	getStrPointer := func(s string) *string { return &s }

	tests := []struct {
		name         string
		composeFiles map[string]string
		files        map[string]string
		workingDir   string
		env          []string
		osEnv        map[string]string
		expectedCfg  *composetypes.Config
		expectedErr  string
	}{
		{
			name: "valid compose file",
			composeFiles: map[string]string{
				"valid.yml": `version: '3'
services:
  web:
    image: nginx:latest`,
			},
			workingDir: dir,
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
			composeFiles: map[string]string{
				"invalid.yml": `not: valid: yaml: content`,
			},
			workingDir:  dir,
			expectedErr: "failed to load compose file: yaml: mapping values are not allowed in this context",
		},
		{
			name: "non-mapping content returns error",
			composeFiles: map[string]string{
				"notmapping.yml": "not valid yaml content",
			},
			workingDir:  dir,
			expectedErr: "failed to load compose file: top-level object must be a mapping",
		},
		{
			name:        "no file paths returns error",
			expectedErr: "failed to load compose file: at least one compose file must be specified",
		},
		{
			name: "service missing image returns error",
			composeFiles: map[string]string{
				"noimage.yml": `version: '3'
services:
  web:
    command: echo hello`,
			},
			workingDir:  dir,
			expectedErr: "invalid image reference for service web: no image specified",
		},
		{
			name: "two compose files are merged",
			composeFiles: map[string]string{
				"base.yml": `version: '3'
services:
  web:
    image: nginx:latest`,
				"override.yml": `version: '3'
services:
  worker:
    image: alpine:latest`,
			},
			workingDir: dir,
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
			composeFiles: map[string]string{
				"envvar.yml": `version: '3'
services:
  web:
    image: nginx:${TAG}`,
			},
			workingDir: dir,
			env:        []string{"TAG=1.25"},
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
			composeFiles: map[string]string{
				"portainerenv.yml": `version: '3'
services:
  web:
    image: nginx:${PORTAINER_TAG}`,
			},
			workingDir: dir,
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
		{
			name: "env_file with relative path is resolved against the compose file directory",
			composeFiles: map[string]string{
				"docker-compose.yaml": `services:
  configtest:
    image: nginx:latest
    env_file:
      - stack.env`,
			},
			files: map[string]string{
				"stack.env": "A=junk",
			},
			workingDir: dir,
			expectedCfg: &composetypes.Config{
				Filename: dir + "/docker-compose.yaml",
				Version:  "3.13",
				Services: composetypes.Services{
					composetypes.ServiceConfig{
						Name: "configtest",
						Environment: composetypes.MappingWithEquals{
							"A": getStrPointer("junk"),
						},
						Image:   "nginx:latest",
						EnvFile: []string{dir + "/stack.env"},
					},
				},
				Networks: map[string]composetypes.NetworkConfig{},
				Volumes:  map[string]composetypes.VolumeConfig{},
				Secrets:  map[string]composetypes.SecretConfig{},
				Configs:  map[string]composetypes.ConfigObjConfig{},
			},
		},
		{
			name: "absolute path env_filed",
			composeFiles: map[string]string{
				"docker-compose.yaml": `services:
  configtest:
    image: nginx:latest
    env_file:
      - ` + dir + "/stack.env",
			},
			files: map[string]string{
				"stack.env": "A=junk",
			},
			workingDir: dir,
			expectedCfg: &composetypes.Config{
				Filename: dir + "/docker-compose.yaml",
				Version:  "3.13",
				Services: composetypes.Services{
					composetypes.ServiceConfig{
						Name: "configtest",
						Environment: composetypes.MappingWithEquals{
							"A": getStrPointer("junk"),
						},
						Image:   "nginx:latest",
						EnvFile: []string{dir + "/stack.env"},
					},
				},
				Networks: map[string]composetypes.NetworkConfig{},
				Volumes:  map[string]composetypes.VolumeConfig{},
				Secrets:  map[string]composetypes.SecretConfig{},
				Configs:  map[string]composetypes.ConfigObjConfig{},
			},
		},
		{
			// Regression test for BE-13157: a Git stack whose compose file lives in a
			// sub-directory must resolve a sibling env_file relative to that sub-directory,
			// not the project root.
			name: "env_file with relative path is resolved within the compose file sub-directory",
			composeFiles: map[string]string{
				"sub/docker-compose.yaml": `services:
  configtest:
    image: nginx:latest
    env_file:
      - stack.env`,
			},
			files: map[string]string{
				"sub/stack.env": "A=junk",
				"stack.env":     "A=not-this-one",
			},
			workingDir: dir,
			expectedCfg: &composetypes.Config{
				Filename: dir + "/sub/docker-compose.yaml",
				Version:  "3.13",
				Services: composetypes.Services{
					composetypes.ServiceConfig{
						Name: "configtest",
						Environment: composetypes.MappingWithEquals{
							"A": getStrPointer("junk"),
						},
						Image:   "nginx:latest",
						EnvFile: []string{dir + "/sub/stack.env"},
					},
				},
				Networks: map[string]composetypes.NetworkConfig{},
				Volumes:  map[string]composetypes.VolumeConfig{},
				Secrets:  map[string]composetypes.SecretConfig{},
				Configs:  map[string]composetypes.ConfigObjConfig{},
			},
		},
		{
			// A compose file in a sub-directory must be able to reach an env_file that lives
			// outside that sub-directory (e.g. an edge-config directory above it) via a "../"
			// relative path. The traversal has to be honored, not stripped.
			name: "env_file with relative path traverses out of the compose file sub-directory",
			composeFiles: map[string]string{
				"sub/docker-compose.yaml": `services:
  configtest:
    image: nginx:latest
    env_file:
      - ../edge-configs/prod/stack.env`,
			},
			files: map[string]string{
				"edge-configs/prod/stack.env": "A=junk",
				"sub/stack.env":               "A=not-this-one",
			},
			workingDir: dir,
			expectedCfg: &composetypes.Config{
				Filename: dir + "/sub/docker-compose.yaml",
				Version:  "3.13",
				Services: composetypes.Services{
					composetypes.ServiceConfig{
						Name: "configtest",
						Environment: composetypes.MappingWithEquals{
							"A": getStrPointer("junk"),
						},
						Image:   "nginx:latest",
						EnvFile: []string{dir + "/edge-configs/prod/stack.env"},
					},
				},
				Networks: map[string]composetypes.NetworkConfig{},
				Volumes:  map[string]composetypes.VolumeConfig{},
				Secrets:  map[string]composetypes.SecretConfig{},
				Configs:  map[string]composetypes.ConfigObjConfig{},
			},
		},
		{
			// env_file declared as a single string (rather than a list) must also be resolved
			// relative to the compose file directory.
			name: "env_file declared as a single string is resolved against the compose file directory",
			composeFiles: map[string]string{
				"docker-compose.yaml": `services:
  configtest:
    image: nginx:latest
    env_file: stack.env`,
			},
			files: map[string]string{
				"stack.env": "A=junk",
			},
			workingDir: dir,
			expectedCfg: &composetypes.Config{
				Filename: dir + "/docker-compose.yaml",
				Version:  "3.13",
				Services: composetypes.Services{
					composetypes.ServiceConfig{
						Name: "configtest",
						Environment: composetypes.MappingWithEquals{
							"A": getStrPointer("junk"),
						},
						Image:   "nginx:latest",
						EnvFile: []string{dir + "/stack.env"},
					},
				},
				Networks: map[string]composetypes.NetworkConfig{},
				Volumes:  map[string]composetypes.VolumeConfig{},
				Secrets:  map[string]composetypes.SecretConfig{},
				Configs:  map[string]composetypes.ConfigObjConfig{},
			},
		},
		{
			name: "env_file with relative path traverses two directories up",
			composeFiles: map[string]string{
				"sub/nested/docker-compose.yaml": `services:
  configtest:
    image: nginx:latest
    env_file:
      - ../../edge-configs/prod/stack.env`,
			},
			files: map[string]string{
				"edge-configs/prod/stack.env": "A=junk",
				"sub/nested/stack.env":        "A=not-this-one",
			},
			workingDir: dir,
			expectedCfg: &composetypes.Config{
				Filename: dir + "/sub/nested/docker-compose.yaml",
				Version:  "3.13",
				Services: composetypes.Services{
					composetypes.ServiceConfig{
						Name: "configtest",
						Environment: composetypes.MappingWithEquals{
							"A": getStrPointer("junk"),
						},
						Image:   "nginx:latest",
						EnvFile: []string{dir + "/edge-configs/prod/stack.env"},
					},
				},
				Networks: map[string]composetypes.NetworkConfig{},
				Volumes:  map[string]composetypes.VolumeConfig{},
				Secrets:  map[string]composetypes.SecretConfig{},
				Configs:  map[string]composetypes.ConfigObjConfig{},
			},
		},
		{
			name: "env_file with ./ prefix is resolved against the compose file directory",
			composeFiles: map[string]string{
				"sub/docker-compose.yaml": `services:
  configtest:
    image: nginx:latest
    env_file:
      - ./stack.env`,
			},
			files: map[string]string{
				"sub/stack.env": "A=junk",
			},
			workingDir: dir,
			expectedCfg: &composetypes.Config{
				Filename: dir + "/sub/docker-compose.yaml",
				Version:  "3.13",
				Services: composetypes.Services{
					composetypes.ServiceConfig{
						Name: "configtest",
						Environment: composetypes.MappingWithEquals{
							"A": getStrPointer("junk"),
						},
						Image:   "nginx:latest",
						EnvFile: []string{dir + "/sub/stack.env"},
					},
				},
				Networks: map[string]composetypes.NetworkConfig{},
				Volumes:  map[string]composetypes.VolumeConfig{},
				Secrets:  map[string]composetypes.SecretConfig{},
				Configs:  map[string]composetypes.ConfigObjConfig{},
			},
		},
		{
			name: "env_file with ./ prefix is resolved against nested compose file directory",
			composeFiles: map[string]string{
				"sub1/sub2/docker-compose.yaml": `services:
  configtest:
    image: nginx:latest
    env_file:
      - ./../edge-configs/prod/stack.env`,
			},
			files: map[string]string{
				"sub1/edge-configs/prod/stack.env": "A=junk",
				"sub1/sub2/stack.env":              "A=not-this-one",
			},
			workingDir: dir,
			expectedCfg: &composetypes.Config{
				Filename: dir + "/sub1/sub2/docker-compose.yaml",
				Version:  "3.13",
				Services: composetypes.Services{
					composetypes.ServiceConfig{
						Name: "configtest",
						Environment: composetypes.MappingWithEquals{
							"A": getStrPointer("junk"),
						},
						Image:   "nginx:latest",
						EnvFile: []string{dir + "/sub1/edge-configs/prod/stack.env"},
					},
				},
				Networks: map[string]composetypes.NetworkConfig{},
				Volumes:  map[string]composetypes.VolumeConfig{},
				Secrets:  map[string]composetypes.SecretConfig{},
				Configs:  map[string]composetypes.ConfigObjConfig{},
			},
		},
		{
			name: "relative env_file with no working dir",
			composeFiles: map[string]string{
				"sub/docker-compose.yaml": `services:
  configtest:
    image: nginx:latest
    env_file:
      - ../edge-configs/prod/stack.env`,
			},
			files: map[string]string{
				"sub/edge-configs/prod/stack.env": "A=junk",
			},
			expectedCfg: &composetypes.Config{
				Filename: dir + "/sub/docker-compose.yaml",
				Version:  "3.13",
				Services: composetypes.Services{
					composetypes.ServiceConfig{
						Name: "configtest",
						Environment: composetypes.MappingWithEquals{
							"A": getStrPointer("junk"),
						},
						Image:   "nginx:latest",
						EnvFile: []string{dir + "/sub/edge-configs/prod/stack.env"},
					},
				},
				Networks: map[string]composetypes.NetworkConfig{},
				Volumes:  map[string]composetypes.VolumeConfig{},
				Secrets:  map[string]composetypes.SecretConfig{},
				Configs:  map[string]composetypes.ConfigObjConfig{},
			},
		},
		{
			name: "relative nested env_file with no working dir",
			composeFiles: map[string]string{
				"sub1/sub2/docker-compose.yaml": `services:
  configtest:
    image: nginx:latest
    env_file:
      - ../edge-configs/prod/stack.env`,
			},
			files: map[string]string{
				"sub1/edge-configs/prod/stack.env":      "A=junk",
				"sub1/sub2/edge-configs/prod/stack.env": "A=this-one",
			},
			expectedCfg: &composetypes.Config{
				Filename: dir + "/sub1/sub2/docker-compose.yaml",
				Version:  "3.13",
				Services: composetypes.Services{
					composetypes.ServiceConfig{
						Name: "configtest",
						Environment: composetypes.MappingWithEquals{
							"A": getStrPointer("this-one"),
						},
						Image:   "nginx:latest",
						EnvFile: []string{dir + "/sub1/sub2/edge-configs/prod/stack.env"},
					},
				},
				Networks: map[string]composetypes.NetworkConfig{},
				Volumes:  map[string]composetypes.VolumeConfig{},
				Secrets:  map[string]composetypes.SecretConfig{},
				Configs:  map[string]composetypes.ConfigObjConfig{},
			},
		},
		{
			name: "secret file with relative path is resolved against the compose file directory",
			composeFiles: map[string]string{
				"docker-compose.yaml": `services:
  web:
    image: nginx:latest
secrets:
  app_secret:
    file: secret.txt`,
			},
			workingDir: dir,
			expectedCfg: &composetypes.Config{
				Filename: dir + "/docker-compose.yaml",
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
				Secrets: map[string]composetypes.SecretConfig{
					"app_secret": {File: dir + "/secret.txt"},
				},
				Configs: map[string]composetypes.ConfigObjConfig{},
			},
		},
		{
			name: "config file with relative path is resolved against the compose file directory",
			composeFiles: map[string]string{
				"docker-compose.yaml": `services:
  web:
    image: nginx:latest
configs:
  app_config:
    file: app.conf`,
			},
			workingDir: dir,
			expectedCfg: &composetypes.Config{
				Filename: dir + "/docker-compose.yaml",
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
				Configs: map[string]composetypes.ConfigObjConfig{
					"app_config": {File: dir + "/app.conf"},
				},
			},
		},
		{
			// A compose file in a sub-directory must be able to reach a secret file that lives
			// outside that sub-directory (e.g. an edge-config directory above it) via a "../"
			// relative path. The traversal has to be honored, not stripped.
			name: "secret file with relative path traverses out of the compose file sub-directory",
			composeFiles: map[string]string{
				"sub/docker-compose.yaml": `services:
  web:
    image: nginx:latest
secrets:
  app_secret:
    file: ../edge-configs/prod/secret.txt`,
			},
			workingDir: dir,
			expectedCfg: &composetypes.Config{
				Filename: dir + "/sub/docker-compose.yaml",
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
				Secrets: map[string]composetypes.SecretConfig{
					"app_secret": {File: dir + "/edge-configs/prod/secret.txt"},
				},
				Configs: map[string]composetypes.ConfigObjConfig{},
			},
		},
		{
			// A "../" traversal that would escape the working dir must be clamped to it, so a
			// malicious compose file cannot reference files outside the project directory.
			name: "secret file with relative path traversing outside the working dir is clamped",
			composeFiles: map[string]string{
				"docker-compose.yaml": `services:
  web:
    image: nginx:latest
secrets:
  app_secret:
    file: ../../../etc/passwd`,
			},
			workingDir: dir,
			expectedCfg: &composetypes.Config{
				Filename: dir + "/docker-compose.yaml",
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
				Secrets: map[string]composetypes.SecretConfig{
					"app_secret": {File: dir + "/etc/passwd"},
				},
				Configs: map[string]composetypes.ConfigObjConfig{},
			},
		},
		{
			name: "secret file with absolute path is left unchanged",
			composeFiles: map[string]string{
				"docker-compose.yaml": `services:
  web:
    image: nginx:latest
secrets:
  app_secret:
    file: /etc/portainer/secret.txt`,
			},
			workingDir: dir,
			expectedCfg: &composetypes.Config{
				Filename: dir + "/docker-compose.yaml",
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
				Secrets: map[string]composetypes.SecretConfig{
					"app_secret": {File: "/etc/portainer/secret.txt"},
				},
				Configs: map[string]composetypes.ConfigObjConfig{},
			},
		},
		{
			name: "external secret has no file and is left unchanged",
			composeFiles: map[string]string{
				"docker-compose.yaml": `services:
  web:
    image: nginx:latest
secrets:
  app_secret:
    external: true`,
			},
			workingDir: dir,
			expectedCfg: &composetypes.Config{
				Filename: dir + "/docker-compose.yaml",
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
				Secrets: map[string]composetypes.SecretConfig{
					"app_secret": {External: composetypes.External{External: true}, Name: "app_secret"},
				},
				Configs: map[string]composetypes.ConfigObjConfig{},
			},
		},
		{
			name: "relative secret file with no working dir is resolved against the compose file directory",
			composeFiles: map[string]string{
				"sub/docker-compose.yaml": `services:
  web:
    image: nginx:latest
secrets:
  app_secret:
    file: secret.txt`,
			},
			expectedCfg: &composetypes.Config{
				Filename: dir + "/sub/docker-compose.yaml",
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
				Secrets: map[string]composetypes.SecretConfig{
					"app_secret": {File: dir + "/sub/secret.txt"},
				},
				Configs: map[string]composetypes.ConfigObjConfig{},
			},
		},
		{
			name: "no services in compose file",
			composeFiles: map[string]string{
				"docker-compose.yaml": `version: "3"`,
			},
			workingDir: dir,
			expectedCfg: &composetypes.Config{
				Filename: dir + "/docker-compose.yaml",
				Version:  "3.13",
				Services: composetypes.Services{},
				Networks: map[string]composetypes.NetworkConfig{},
				Volumes:  map[string]composetypes.VolumeConfig{},
				Secrets:  map[string]composetypes.SecretConfig{},
				Configs:  map[string]composetypes.ConfigObjConfig{},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			filePaths := make([]string, 0, len(tt.composeFiles))
			for filename, content := range tt.composeFiles {
				filePaths = append(filePaths, writeFile(filename, content))
			}
			slices.Sort(filePaths)

			for filename, content := range tt.files {
				writeFile(filename, content)
			}

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

// Test_Validate is a smoke test for the public Validate method, which delegates to getConfig
// (exhaustively covered by Test_getConfig). It only parses compose files, so no Docker is needed.
func Test_Validate(t *testing.T) {
	dir := t.TempDir()
	deployer := NewSwarmDeployer()

	validPath := filesystem.JoinPaths(dir, "valid.yml")
	require.NoError(t, os.WriteFile(validPath, []byte("version: '3'\nservices:\n  web:\n    image: nginx:latest"), 0o644))
	require.NoError(t, deployer.Validate(t.Context(), []string{validPath}, Options{WorkingDir: dir}))

	invalidPath := filesystem.JoinPaths(dir, "invalid.yml")
	require.NoError(t, os.WriteFile(invalidPath, []byte("not valid yaml content"), 0o644))
	err := deployer.Validate(t.Context(), []string{invalidPath}, Options{WorkingDir: dir})
	require.ErrorContains(t, err, "failed to load compose file: top-level object must be a mapping")
}

type mockAPIClient struct {
	client.APIClient
	serviceListFn   func(context.Context, swarm.ServiceListOptions) ([]swarm.Service, error)
	taskListFn      func(context.Context, swarm.TaskListOptions) ([]swarm.Task, error)
	serviceUpdateFn func(
		context.Context,
		string,
		swarm.Version,
		swarm.ServiceSpec,
		swarm.ServiceUpdateOptions,
	) (swarm.ServiceUpdateResponse, error)
}

func (m *mockAPIClient) ServiceList(ctx context.Context, opts swarm.ServiceListOptions) ([]swarm.Service, error) {
	if m.serviceListFn == nil {
		return nil, nil
	}

	return m.serviceListFn(ctx, opts)
}

func (m *mockAPIClient) TaskList(ctx context.Context, opts swarm.TaskListOptions) ([]swarm.Task, error) {
	if m.taskListFn == nil {
		return nil, nil
	}

	return m.taskListFn(ctx, opts)
}

func (m *mockAPIClient) ServiceUpdate(
	ctx context.Context,
	id string,
	ver swarm.Version,
	spec swarm.ServiceSpec,
	opts swarm.ServiceUpdateOptions,
) (swarm.ServiceUpdateResponse, error) {
	if m.serviceUpdateFn == nil {
		return swarm.ServiceUpdateResponse{}, nil
	}

	return m.serviceUpdateFn(ctx, id, ver, spec, opts)
}

func Test_deployServices_forceRecreate(t *testing.T) {
	t.Parallel()

	const initialForceUpdate = uint64(3)

	tests := []struct {
		name                string
		forceRecreate       bool
		expectedForceUpdate uint64
	}{
		{"true increments ForceUpdate", true, initialForceUpdate + 1},
		{"false preserves ForceUpdate", false, initialForceUpdate},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			existingSvc := swarm.Service{
				ID:   "svc-id-1",
				Meta: swarm.Meta{Version: swarm.Version{Index: 10}},
				Spec: swarm.ServiceSpec{
					Annotations: swarm.Annotations{Name: "mystack_web"},
					TaskTemplate: swarm.TaskSpec{
						ForceUpdate:   initialForceUpdate,
						ContainerSpec: &swarm.ContainerSpec{Image: "nginx:latest"},
					},
				},
			}

			var capturedForceUpdate uint64
			mock := &mockAPIClient{
				serviceListFn: func(_ context.Context, _ swarm.ServiceListOptions) ([]swarm.Service, error) {
					return []swarm.Service{existingSvc}, nil
				},
				serviceUpdateFn: func(
					_ context.Context,
					_ string,
					_ swarm.Version,
					spec swarm.ServiceSpec,
					_ swarm.ServiceUpdateOptions,
				) (swarm.ServiceUpdateResponse, error) {
					capturedForceUpdate = spec.TaskTemplate.ForceUpdate
					return swarm.ServiceUpdateResponse{}, nil
				},
			}

			services := map[string]swarm.ServiceSpec{
				"web": {
					TaskTemplate: swarm.TaskSpec{
						ContainerSpec: &swarm.ContainerSpec{Image: "nginx:latest"},
					},
				},
			}

			namespace := convert.NewNamespace("mystack")
			err := deployServices(context.Background(), mock, nil, services, namespace, false, tt.forceRecreate)
			require.NoError(t, err)
			require.Equal(t, tt.expectedForceUpdate, capturedForceUpdate)
		})
	}
}

func Test_getServiceStatus(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name           string
		task           swarm.Task
		expectedStatus libstack.Status
		expectedErrMsg string
	}{
		{
			name:           "running task reports running",
			task:           swarm.Task{Status: swarm.TaskStatus{State: swarm.TaskStateRunning}},
			expectedStatus: libstack.StatusRunning,
		},
		{
			name:           "pending task reports starting",
			task:           swarm.Task{Status: swarm.TaskStatus{State: swarm.TaskStatePending}},
			expectedStatus: libstack.StatusStarting,
		},
		{
			name:           "failed task reports error with message",
			task:           swarm.Task{Status: swarm.TaskStatus{State: swarm.TaskStateFailed, Err: "task: non-zero exit (1)"}},
			expectedStatus: libstack.StatusError,
			expectedErrMsg: "task: non-zero exit (1)",
		},
		{
			// Regression case for #13213: a rejected task must report an error, not "unknown".
			name: "rejected task reports error with message",
			task: swarm.Task{Status: swarm.TaskStatus{
				State: swarm.TaskStateRejected,
				Err:   "No such image: this-image-definitely-does-not-exist-xyz:latest",
			}},
			expectedStatus: libstack.StatusError,
			expectedErrMsg: "No such image: this-image-definitely-does-not-exist-xyz:latest",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			mock := &mockAPIClient{
				taskListFn: func(context.Context, swarm.TaskListOptions) ([]swarm.Task, error) {
					return []swarm.Task{tt.task}, nil
				},
			}

			svc := swarm.Service{ID: "svc-id-1", Spec: swarm.ServiceSpec{Annotations: swarm.Annotations{Name: "mystack_web"}}}

			status, errMsg, err := getServiceStatus(context.Background(), mock, svc)
			require.NoError(t, err)
			require.Equal(t, tt.expectedStatus, status)
			require.Equal(t, tt.expectedErrMsg, errMsg)
		})
	}
}
