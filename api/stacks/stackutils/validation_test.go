package stackutils

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/pkg/libhttp/ssrf"

	"github.com/docker/docker/api/types/volume"
	"github.com/docker/docker/client"
	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/require"
)

func newVolumeInspectClient(t *testing.T, name string, vol volume.Volume) *client.Client {
	t.Helper()

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodHead && r.URL.Path == "/_ping" {
			w.Header().Add("Api-Version", "1.51")
			_, _ = w.Write([]byte{})

			return
		}

		if r.URL.Path == "/v1.51/volumes/"+name {
			w.Header().Set("Content-Type", "application/json")
			_ = json.NewEncoder(w).Encode(vol)

			return
		}

		http.NotFound(w, r)
	}))
	t.Cleanup(srv.Close)

	cli, err := client.NewClientWithOpts(client.WithHost(srv.URL), client.WithHTTPClient(http.DefaultClient), client.WithVersion("1.51"))
	require.NoError(t, err)

	return cli
}

func TestIsValidStackFile_DefaultPortEnvSubstitution(t *testing.T) {
	t.Parallel()
	yamlContent := []byte(`
version: "3"

services:
  webservice:
    image: nginx
    container_name: hello-world
    networks:
      - "mynet1"
    ports:
      - "${PORT:-8080}:80"

networks:
  mynet1:
    driver: bridge
    ipam:
      config:
        - subnet: 172.16.0.0/24
`)

	securitySettings := &portainer.EndpointSecuritySettings{}
	err := IsValidStackFile(StackFileValidationConfig{
		Content:          yamlContent,
		SecuritySettings: securitySettings,
	})
	require.NoError(t, err)
}

// TestIsValidStackFile_MissingEnvVarBehavior documents how port variable position affects
// validation when the env var is not provided. Docker accepts an empty host port (left side)
// but requires a valid container port (right side).
func TestIsValidStackFile_MissingEnvVarBehavior(t *testing.T) {
	t.Parallel()
	securitySettings := &portainer.EndpointSecuritySettings{}

	t.Run("var on left side only passes (docker allows :9090)", func(t *testing.T) {
		err := IsValidStackFile(StackFileValidationConfig{
			Content: []byte(`
version: "3"
services:
  api:
    image: nginx
    ports:
      - "${API_PORT}:9090"
`),
			SecuritySettings: securitySettings,
		})
		require.NoError(t, err)
	})

	t.Run("var on right side fails", func(t *testing.T) {
		err := IsValidStackFile(StackFileValidationConfig{
			Content: []byte(`
version: "3"
services:
  api:
    image: nginx
    ports:
      - "9090:${API_PORT}"
`),
			SecuritySettings: securitySettings,
		})
		require.Error(t, err)
	})

	t.Run("var on both sides fails", func(t *testing.T) {
		err := IsValidStackFile(StackFileValidationConfig{
			Content: []byte(`
version: "3"
services:
  api:
    image: nginx
    ports:
      - "${API_PORT}:${API_PORT}"
`),
			SecuritySettings: securitySettings,
		})
		require.Error(t, err)
	})
}

func TestIsValidStackFile_EnvVarInBothPortFields(t *testing.T) {
	t.Parallel()
	securitySettings := &portainer.EndpointSecuritySettings{}
	err := IsValidStackFile(StackFileValidationConfig{
		Content: []byte(`
version: "3"

services:
  api:
    image: nginx
    ports:
      - "${API_PORT}:${API_PORT}"
`),
		SecuritySettings: securitySettings,
		Env:              map[string]string{"API_PORT": "3000"},
	})
	require.NoError(t, err)
}

type mockFileService struct {
	portainer.FileService
	fileContent        []byte
	projectVersionPath string
}

func (m mockFileService) GetFileContent(trustedRootPath, filePath string) ([]byte, error) {
	return m.fileContent, nil
}

func (m mockFileService) FormProjectPathByVersion(projectPath string, version int, commitHash string) string {
	return m.projectVersionPath
}

func TestValidateStackFiles_EnvVars(t *testing.T) {
	t.Parallel()
	fileContent := []byte(`
version: "3"

services:
  api:
    image: nginx
    ports:
      - "${API_PORT}:${API_PORT}"
`)

	stack := &portainer.Stack{
		ProjectPath: "/tmp/stack/1",
		EntryPoint:  "docker-compose.yml",
		Env:         []portainer.Pair{{Name: "API_PORT", Value: "3000"}},
	}

	fileService := mockFileService{
		fileContent:        fileContent,
		projectVersionPath: "/tmp/stack/1",
	}

	securitySettings := &portainer.EndpointSecuritySettings{}
	err := ValidateStackFiles(stack, securitySettings, fileService, nil)
	require.NoError(t, err)
}

// TestValidateStackFiles_QuotedEnvVar guards against a regression where quoted
// numeric env var values (e.g. API_PORT="8005") failed validation while the
// actual deployment (which parses env vars through an env file) accepted them.
func TestValidateStackFiles_QuotedEnvVar(t *testing.T) {
	t.Parallel()
	fileContent := []byte(`
version: "3"

services:
  api:
    image: nginx
    ports:
      - "${API_PORT}:8005"
`)

	stack := &portainer.Stack{
		ProjectPath: "/tmp/stack/1",
		EntryPoint:  "docker-compose.yml",
		Env:         []portainer.Pair{{Name: "API_PORT", Value: `"8005"`}},
	}

	fileService := mockFileService{
		fileContent:        fileContent,
		projectVersionPath: "/tmp/stack/1",
	}

	securitySettings := &portainer.EndpointSecuritySettings{}
	err := ValidateStackFiles(stack, securitySettings, fileService, nil)
	require.NoError(t, err)
}

// TestValidateStackFiles_InvalidStackEnv guards against a regression where a
// BuildEnvMap parse error (e.g. an unterminated quoted value) was silently
// swallowed instead of being surfaced to the caller.
func TestValidateStackFiles_InvalidStackEnv(t *testing.T) {
	t.Parallel()
	fileContent := []byte(`
version: "3"

services:
  api:
    image: nginx
    ports:
      - "${API_PORT}:8005"
`)

	stack := &portainer.Stack{
		ProjectPath: "/tmp/stack/1",
		EntryPoint:  "docker-compose.yml",
		Env:         []portainer.Pair{{Name: "API_PORT", Value: `"unterminated`}},
	}

	fileService := mockFileService{
		fileContent:        fileContent,
		projectVersionPath: "/tmp/stack/1",
	}

	securitySettings := &portainer.EndpointSecuritySettings{}
	err := ValidateStackFiles(stack, securitySettings, fileService, nil)
	require.ErrorContains(t, err, "failed to build stack environment variables")
}

func TestValidateStackFiles_OSEnvVar(t *testing.T) {
	t.Setenv("HOST_PORT", "3000")

	fileContent := []byte(`
version: "3"
services:
  api:
    image: nginx
    ports:
      - "80:${HOST_PORT}"
`)

	stack := &portainer.Stack{
		ProjectPath: "/tmp/stack/1",
		EntryPoint:  "docker-compose.yml",
	}

	fileService := mockFileService{
		fileContent:        fileContent,
		projectVersionPath: "/tmp/stack/1",
	}

	securitySettings := &portainer.EndpointSecuritySettings{}
	err := ValidateStackFiles(stack, securitySettings, fileService, nil)
	require.NoError(t, err)
}

func TestValidateStackFiles_DotEnvFile(t *testing.T) {
	t.Parallel()
	tmpDir := t.TempDir()

	err := os.WriteFile(filesystem.JoinPaths(tmpDir, ".env"), []byte("HOST_PORT=3000\n"), 0o600)
	require.NoError(t, err)

	fileContent := []byte(`
version: "3"
services:
  api:
    image: nginx
    ports:
      - "80:${HOST_PORT}"
`)

	stack := &portainer.Stack{
		ProjectPath: tmpDir,
		EntryPoint:  "docker-compose.yml",
	}

	fileService := mockFileService{
		fileContent:        fileContent,
		projectVersionPath: tmpDir,
	}

	securitySettings := &portainer.EndpointSecuritySettings{}
	err = ValidateStackFiles(stack, securitySettings, fileService, nil)
	require.NoError(t, err)
}

func TestValidateStackFiles_EnvFileAttribute(t *testing.T) {
	t.Parallel()
	tmpDir := t.TempDir()

	err := os.WriteFile(filesystem.JoinPaths(tmpDir, "web.env"), []byte("HOST_PORT=3000\n"), 0o600)
	require.NoError(t, err)

	fileContent := []byte(`
version: "3"
services:
  api:
    image: nginx
    env_file:
      - ./web.env
`)

	stack := &portainer.Stack{
		ProjectPath: tmpDir,
		EntryPoint:  "docker-compose.yml",
	}

	fileService := mockFileService{
		fileContent:        fileContent,
		projectVersionPath: tmpDir,
	}

	securitySettings := &portainer.EndpointSecuritySettings{}
	err = ValidateStackFiles(stack, securitySettings, fileService, nil)
	require.NoError(t, err)
}

func TestValidateStackFiles_BindMountBlockedForNonAdmin(t *testing.T) {
	t.Parallel()
	fileContent := []byte(`
version: "3"

services:
  api:
    image: nginx
    volumes:
      - /host/path:/container/path
`)

	stack := &portainer.Stack{
		ProjectPath: "/tmp/stack/1",
		EntryPoint:  "docker-compose.yml",
	}

	fileService := mockFileService{
		fileContent:        fileContent,
		projectVersionPath: "/tmp/stack/1",
	}

	securitySettings := &portainer.EndpointSecuritySettings{
		AllowBindMountsForRegularUsers: false,
	}
	err := ValidateStackFiles(stack, securitySettings, fileService, nil)
	require.ErrorContains(t, err, "bind-mount disabled for non administrator users")
}

func TestValidateStackFiles_ConfigFileHostEscapeBlockedForNonAdmin(t *testing.T) {
	t.Parallel()
	fileContent := []byte(`
version: "3"

services:
  api:
    image: nginx
    configs:
      - leak

configs:
  leak:
    file: /etc/shadow
`)

	stack := &portainer.Stack{
		ProjectPath: "/tmp/stack/1",
		EntryPoint:  "docker-compose.yml",
	}

	fileService := mockFileService{
		fileContent:        fileContent,
		projectVersionPath: "/tmp/stack/1",
	}

	securitySettings := &portainer.EndpointSecuritySettings{
		AllowBindMountsForRegularUsers: false,
	}
	err := ValidateStackFiles(stack, securitySettings, fileService, nil)
	require.ErrorContains(t, err, "reading a file from the host is disabled for non administrator users")
}

func TestValidateStackFiles_ConfigFileInsideProjectAllowedForNonAdmin(t *testing.T) {
	t.Parallel()
	tmpDir := t.TempDir()

	err := os.WriteFile(filesystem.JoinPaths(tmpDir, "nginx.conf"), []byte("server {}"), 0o600)
	require.NoError(t, err)

	fileContent := []byte(`
version: "3"

services:
  api:
    image: nginx
    configs:
      - site

configs:
  site:
    file: ./nginx.conf
`)

	stack := &portainer.Stack{
		ProjectPath: tmpDir,
		EntryPoint:  "docker-compose.yml",
	}

	fileService := mockFileService{
		fileContent:        fileContent,
		projectVersionPath: tmpDir,
	}

	securitySettings := &portainer.EndpointSecuritySettings{
		AllowBindMountsForRegularUsers: false,
	}
	err = ValidateStackFiles(stack, securitySettings, fileService, nil)
	require.NoError(t, err)
}

func TestIsValidStackFile_VolumeBindMountRestrictions(t *testing.T) {
	t.Parallel()

	const forbidden = "bind-mount disabled for non administrator users"

	f := func(yamlContent []byte, stackName string, dockerClient *client.Client, wantErrSubstring string) {
		t.Helper()

		securitySettings := &portainer.EndpointSecuritySettings{AllowBindMountsForRegularUsers: false}
		err := IsValidStackFile(StackFileValidationConfig{
			Content:          yamlContent,
			SecuritySettings: securitySettings,
			StackName:        stackName,
			DockerClient:     dockerClient,
		})

		if wantErrSubstring == "" {
			require.NoError(t, err)

			return
		}

		require.ErrorContains(t, err, wantErrSubstring)
	}

	// a top-level named volume using the local driver's bind-mount trick is rejected
	f([]byte(`
version: "3"

services:
  api:
    image: nginx
    volumes:
      - data:/var/lib/data

volumes:
  data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /etc
`), "", nil, forbidden)

	// a top-level named volume mounting a real filesystem type via a device is rejected
	f([]byte(`
version: "3"

services:
  api:
    image: nginx
    volumes:
      - data:/var/lib/data

volumes:
  data:
    driver: local
    driver_opts:
      type: ext4
      device: /dev/sda1
`), "", nil, forbidden)

	// service-level volume "type: BIND" match is case-insensitive
	f([]byte(`
version: "3"

services:
  api:
    image: nginx
    volumes:
      - type: BIND
        source: /host/path
        target: /container/path
`), "", nil, forbidden)

	// service-level volume "type: npipe" (Windows named pipe) is bind-equivalent
	f([]byte(`
version: "3"

services:
  api:
    image: nginx
    volumes:
      - type: npipe
        source: \\.\pipe\docker_engine
        target: \\.\pipe\docker_engine
`), "", nil, forbidden)

	// an external volume that is actually bind-backed is rejected
	f([]byte(`
version: "3"

services:
  api:
    image: nginx
    volumes:
      - data:/var/lib/data

volumes:
  data:
    external: true
`), "mystack", newVolumeInspectClient(t, "data", volume.Volume{
		Name:    "data",
		Driver:  "local",
		Options: map[string]string{"type": "none", "o": "bind", "device": "/etc"},
	}), forbidden)

	// a non-external volume that reuses an existing bind-backed volume is rejected
	f([]byte(`
version: "3"

services:
  api:
    image: nginx
    volumes:
      - data:/var/lib/data

volumes:
  data: {}
`), "mystack", newVolumeInspectClient(t, "mystack_data", volume.Volume{
		Name:    "mystack_data",
		Driver:  "local",
		Options: map[string]string{"type": "none", "o": "bind", "device": "/etc"},
	}), forbidden)

	// with no Docker client, the existing-volume check fails closed rather than being skipped
	f([]byte(`
version: "3"

services:
  api:
    image: nginx
    volumes:
      - data:/var/lib/data

volumes:
  data: {}
`), "mystack", nil, "unable to verify bind-mount status without a Docker client")

	// an explicit "name:" override resolves to the overridden Docker-side name
	f([]byte(`
version: "3"

services:
  api:
    image: nginx
    volumes:
      - data:/var/lib/data

volumes:
  data:
    name: custom-volume-name
`), "mystack", newVolumeInspectClient(t, "custom-volume-name", volume.Volume{
		Name:    "custom-volume-name",
		Driver:  "local",
		Options: map[string]string{"type": "none", "o": "bind", "device": "/etc"},
	}), forbidden)
}

func TestIsValidStackFile_ConfigAndSecretFileRestrictions(t *testing.T) {
	t.Parallel()

	const workingDir = "/data/compose/17"
	const forbidden = "reading a file from the host is disabled for non administrator users"

	f := func(yamlContent []byte, allowBindMounts bool, wantErrSubstring string) {
		t.Helper()

		err := IsValidStackFile(StackFileValidationConfig{
			Content:          yamlContent,
			SecuritySettings: &portainer.EndpointSecuritySettings{AllowBindMountsForRegularUsers: allowBindMounts},
			WorkingDir:       workingDir,
			ProjectPath:      workingDir,
		})

		if wantErrSubstring == "" {
			require.NoError(t, err)

			return
		}

		require.ErrorContains(t, err, wantErrSubstring)
	}

	// a config reading an absolute host path is rejected
	f([]byte(`
services:
  api:
    image: nginx
    configs:
      - leak

configs:
  leak:
    file: /etc/shadow
`), false, forbidden)

	// a config climbing out of the stack directory is rejected
	f([]byte(`
services:
  api:
    image: nginx
    configs:
      - leak

configs:
  leak:
    file: ../../../../etc/shadow
`), false, forbidden)

	// the same trick through a secret is rejected
	f([]byte(`
services:
  api:
    image: nginx
    secrets:
      - leak

secrets:
  leak:
    file: /root/.ssh/id_rsa
`), false, forbidden)

	// a config file shipped with the stack keeps working
	f([]byte(`
services:
  api:
    image: nginx
    configs:
      - site

configs:
  site:
    file: ./nginx.conf
`), false, "")

	// inline content is not a host path
	f([]byte(`
services:
  api:
    image: nginx
    configs:
      - site

configs:
  site:
    content: |
      server { listen 80; }
`), false, "")

	// administrators are still allowed to read host paths
	f([]byte(`
services:
  api:
    image: nginx
    configs:
      - leak

configs:
  leak:
    file: /etc/shadow
`), true, "")
}

func TestIsValidStackFile_EnvFileRestrictions(t *testing.T) {
	t.Parallel()

	const forbidden = "reading a file from the host is disabled for non administrator users"

	root := t.TempDir()
	projectDir := filesystem.JoinPaths(root, "project")
	outsideDir := filesystem.JoinPaths(root, "outside")

	err := os.MkdirAll(projectDir, 0700)
	require.NoError(t, err)

	err = os.MkdirAll(outsideDir, 0700)
	require.NoError(t, err)

	err = os.WriteFile(filesystem.JoinPaths(projectDir, "web.env"), []byte("HOST_PORT=3000\n"), 0600)
	require.NoError(t, err)

	outsideFile := filesystem.JoinPaths(outsideDir, "secret.env")
	err = os.WriteFile(outsideFile, []byte("HOST_PORT=3000\n"), 0600)
	require.NoError(t, err)

	f := func(yamlContent []byte, allowBindMounts bool, wantErrSubstring string) {
		t.Helper()

		err := IsValidStackFile(StackFileValidationConfig{
			Content:          yamlContent,
			SecuritySettings: &portainer.EndpointSecuritySettings{AllowBindMountsForRegularUsers: allowBindMounts},
			WorkingDir:       projectDir,
			ProjectPath:      projectDir,
		})

		if wantErrSubstring == "" {
			require.NoError(t, err)

			return
		}

		require.ErrorContains(t, err, wantErrSubstring)
	}

	// an env_file reading an absolute host path outside the project is rejected
	f([]byte(`
services:
  api:
    image: nginx
    env_file:
      - `+outsideFile+`
`), false, forbidden)

	// an env_file pointing outside the project is rejected even when the target
	// doesn't exist, proving the check runs before compose-go's own env_file
	// resolution ever touches the filesystem
	f([]byte(`
services:
  api:
    image: nginx
    env_file:
      - /this/path/does/not/exist/at/all.env
`), false, forbidden)

	// an env_file climbing out of the stack directory is rejected
	f([]byte(`
services:
  api:
    image: nginx
    env_file:
      - ../outside/secret.env
`), false, forbidden)

	// an env_file shipped with the stack keeps working
	f([]byte(`
services:
  api:
    image: nginx
    env_file:
      - ./web.env
`), false, "")

	// administrators are still allowed to read host paths
	f([]byte(`
services:
  api:
    image: nginx
    env_file:
      - `+outsideFile+`
`), true, "")
}

func TestIsValidStackFile_LabelFileRestrictions(t *testing.T) {
	t.Parallel()

	const forbidden = "reading a file from the host is disabled for non administrator users"

	root := t.TempDir()
	projectDir := filesystem.JoinPaths(root, "project")
	outsideDir := filesystem.JoinPaths(root, "outside")

	err := os.MkdirAll(projectDir, 0700)
	require.NoError(t, err)

	err = os.MkdirAll(outsideDir, 0700)
	require.NoError(t, err)

	err = os.WriteFile(filesystem.JoinPaths(projectDir, "labels.env"), []byte("owner=team-a\n"), 0600)
	require.NoError(t, err)

	outsideFile := filesystem.JoinPaths(outsideDir, "secret.env")
	err = os.WriteFile(outsideFile, []byte("owner=team-a\n"), 0600)
	require.NoError(t, err)

	f := func(yamlContent []byte, allowBindMounts bool, wantErrSubstring string) {
		t.Helper()

		err := IsValidStackFile(StackFileValidationConfig{
			Content:          yamlContent,
			SecuritySettings: &portainer.EndpointSecuritySettings{AllowBindMountsForRegularUsers: allowBindMounts},
			WorkingDir:       projectDir,
			ProjectPath:      projectDir,
		})

		if wantErrSubstring == "" {
			require.NoError(t, err)

			return
		}

		require.ErrorContains(t, err, wantErrSubstring)
	}

	// a label_file reading an absolute host path outside the project is rejected
	f([]byte(`
services:
  api:
    image: nginx
    label_file:
      - `+outsideFile+`
`), false, forbidden)

	// a label_file pointing outside the project is rejected even when the target
	// doesn't exist, proving the check runs before compose-go's own label_file
	// resolution ever touches the filesystem
	f([]byte(`
services:
  api:
    image: nginx
    label_file:
      - /this/path/does/not/exist/at/all.env
`), false, forbidden)

	// a label_file climbing out of the stack directory is rejected
	f([]byte(`
services:
  api:
    image: nginx
    label_file:
      - ../outside/secret.env
`), false, forbidden)

	// a label_file shipped with the stack keeps working
	f([]byte(`
services:
  api:
    image: nginx
    label_file:
      - ./labels.env
`), false, "")

	// administrators are still allowed to read host paths
	f([]byte(`
services:
  api:
    image: nginx
    label_file:
      - `+outsideFile+`
`), true, "")
}

func TestIsValidStackFile_BuildContextRestrictions(t *testing.T) {
	t.Parallel()

	const workingDir = "/data/compose/17"
	const forbidden = "reading a file from the host is disabled for non administrator users"

	f := func(yamlContent []byte, allowBindMounts bool, wantErrSubstring string) {
		t.Helper()

		err := IsValidStackFile(StackFileValidationConfig{
			Content:          yamlContent,
			SecuritySettings: &portainer.EndpointSecuritySettings{AllowBindMountsForRegularUsers: allowBindMounts},
			WorkingDir:       workingDir,
			ProjectPath:      workingDir,
		})

		if wantErrSubstring == "" {
			require.NoError(t, err)

			return
		}

		require.ErrorContains(t, err, wantErrSubstring)
	}

	// a build context reading an absolute host path is rejected
	f([]byte(`
services:
  api:
    build:
      context: /etc
      dockerfile_inline: |
        FROM alpine
        COPY . /leak
`), false, forbidden)

	// a build context climbing out of the stack directory is rejected
	f([]byte(`
services:
  api:
    build:
      context: ../../../../etc
      dockerfile_inline: |
        FROM alpine
        COPY . /leak
`), false, forbidden)

	// an additional build context outside the stack directory is rejected too
	f([]byte(`
services:
  api:
    build:
      context: .
      additional_contexts:
        leak: /etc
`), false, forbidden)

	// a build context shipped with the stack keeps working
	f([]byte(`
services:
  api:
    build:
      context: ./backend
`), false, "")

	// a remote build context is left alone, it is not a local host path
	f([]byte(`
services:
  api:
    build:
      context: https://github.com/portainer/portainer.git
`), false, "")

	// administrators are still allowed to read host paths
	f([]byte(`
services:
  api:
    build:
      context: /etc
      dockerfile_inline: |
        FROM alpine
        COPY . /leak
`), true, "")
}

func TestIsValidStackFile_DockerfileRestrictions(t *testing.T) {
	t.Parallel()

	const workingDir = "/data/compose/17"
	const forbidden = "reading a file from the host is disabled for non administrator users"

	f := func(yamlContent []byte, allowBindMounts bool, wantErrSubstring string) {
		t.Helper()

		err := IsValidStackFile(StackFileValidationConfig{
			Content:          yamlContent,
			SecuritySettings: &portainer.EndpointSecuritySettings{AllowBindMountsForRegularUsers: allowBindMounts},
			WorkingDir:       workingDir,
			ProjectPath:      workingDir,
		})

		if wantErrSubstring == "" {
			require.NoError(t, err)

			return
		}

		require.ErrorContains(t, err, wantErrSubstring)
	}

	// an absolute dockerfile path outside the project is rejected, even though
	// the build context itself is safely inside the project
	f([]byte(`
services:
  api:
    build:
      context: .
      dockerfile: /etc/passwd
`), false, forbidden)

	// a dockerfile climbing out of the build context is rejected
	f([]byte(`
services:
  api:
    build:
      context: .
      dockerfile: ../../../../etc/passwd
`), false, forbidden)

	// a dockerfile inside the build context keeps working
	f([]byte(`
services:
  api:
    build:
      context: .
      dockerfile: docker/Dockerfile.prod
`), false, "")

	// dockerfile_inline needs no path check, it carries its content in the compose file itself
	f([]byte(`
services:
  api:
    build:
      context: .
      dockerfile_inline: |
        FROM alpine
`), false, "")

	// administrators are still allowed to read host paths
	f([]byte(`
services:
  api:
    build:
      context: .
      dockerfile: /etc/passwd
`), true, "")
}

func TestIsValidStackFile_BuildSSHRestrictions(t *testing.T) {
	t.Parallel()

	const workingDir = "/data/compose/17"
	const forbidden = "reading a file from the host is disabled for non administrator users"

	f := func(yamlContent []byte, allowBindMounts bool, wantErrSubstring string) {
		t.Helper()

		err := IsValidStackFile(StackFileValidationConfig{
			Content:          yamlContent,
			SecuritySettings: &portainer.EndpointSecuritySettings{AllowBindMountsForRegularUsers: allowBindMounts},
			WorkingDir:       workingDir,
			ProjectPath:      workingDir,
		})

		if wantErrSubstring == "" {
			require.NoError(t, err)

			return
		}

		require.ErrorContains(t, err, wantErrSubstring)
	}

	// a build ssh key reading an absolute host path is rejected
	f([]byte(`
services:
  api:
    build:
      context: .
      ssh:
        - myid=/etc/shadow
`), false, forbidden)

	// a build ssh key climbing out of the stack directory is rejected
	f([]byte(`
services:
  api:
    build:
      context: .
      ssh:
        - myid=../../../../etc/shadow
`), false, forbidden)

	// a build ssh key shipped with the stack keeps working
	f([]byte(`
services:
  api:
    build:
      context: .
      ssh:
        - myid=./id_rsa
`), false, "")

	// the "default" ssh agent socket has no path and is left alone
	f([]byte(`
services:
  api:
    build:
      context: .
      ssh:
        - default
`), false, "")

	// administrators are still allowed to read host paths
	f([]byte(`
services:
  api:
    build:
      context: .
      ssh:
        - myid=/etc/shadow
`), true, "")
}

func TestIsValidStackFile_DevelopWatchRestrictions(t *testing.T) {
	t.Parallel()

	const workingDir = "/data/compose/17"
	const forbidden = "reading a file from the host is disabled for non administrator users"

	f := func(yamlContent []byte, allowBindMounts bool, wantErrSubstring string) {
		t.Helper()

		err := IsValidStackFile(StackFileValidationConfig{
			Content:          yamlContent,
			SecuritySettings: &portainer.EndpointSecuritySettings{AllowBindMountsForRegularUsers: allowBindMounts},
			WorkingDir:       workingDir,
			ProjectPath:      workingDir,
		})

		if wantErrSubstring == "" {
			require.NoError(t, err)

			return
		}

		require.ErrorContains(t, err, wantErrSubstring)
	}

	// a develop.watch path reading an absolute host path is rejected
	f([]byte(`
services:
  api:
    image: nginx
    develop:
      watch:
        - path: /etc
          action: sync
          target: /app
`), false, forbidden)

	// a develop.watch path climbing out of the stack directory is rejected
	f([]byte(`
services:
  api:
    image: nginx
    develop:
      watch:
        - path: ../../../../etc
          action: sync
          target: /app
`), false, forbidden)

	// a develop.watch path shipped with the stack keeps working
	f([]byte(`
services:
  api:
    image: nginx
    develop:
      watch:
        - path: ./src
          action: sync
          target: /app
`), false, "")

	// administrators are still allowed to read host paths
	f([]byte(`
services:
  api:
    image: nginx
    develop:
      watch:
        - path: /etc
          action: sync
          target: /app
`), true, "")
}

// TestIsValidStackFile_IncludeDisabledForNonAdmin documents why `include` is
// disabled outright for non-admins instead of being validated field by field
// like the other file-reading attributes: compose-go's `include` processing
// resolves `include.env_file` by reading files directly from disk, bypassing
// the ResourceLoaders mechanism entirely, so a per-field containment check
// can be bypassed. Disabling the whole feature avoids relying on having
// found every such bypass.
func TestIsValidStackFile_IncludeDisabledForNonAdmin(t *testing.T) {
	t.Parallel()

	root := t.TempDir()
	projectDir := filesystem.JoinPaths(root, "project")

	err := os.MkdirAll(projectDir, 0700)
	require.NoError(t, err)

	f := func(yamlContent []byte, allowBindMounts bool, wantErrSubstring string) {
		t.Helper()

		err := IsValidStackFile(StackFileValidationConfig{
			Content:          yamlContent,
			SecuritySettings: &portainer.EndpointSecuritySettings{AllowBindMountsForRegularUsers: allowBindMounts},
			WorkingDir:       projectDir,
			ProjectPath:      projectDir,
		})

		if wantErrSubstring == "" {
			require.NoError(t, err)

			return
		}

		require.ErrorContains(t, err, wantErrSubstring)
	}

	// for a non-admin, an include pointing at a file that doesn't even exist
	// is silently ignored rather than erroring, proving it is never touched
	// on disk at all
	f([]byte(`
include:
  - /this/path/does/not/exist/at/all.yml

services:
  api:
    image: nginx
`), false, "")

	// the include.env_file bypass is closed the same way: it is never reached
	// because include processing does not run at all for non-admins
	f([]byte(`
include:
  - path: /this/path/does/not/exist/either.yml
    env_file: /etc/shadow

services:
  api:
    image: nginx
`), false, "")

	// administrators are unaffected: include is still fully processed, so a
	// nonexistent path surfaces the underlying "file not found" error
	f([]byte(`
include:
  - /this/path/does/not/exist/at/all.yml

services:
  api:
    image: nginx
`), true, "no such file or directory")
}

func TestIsValidStackFile_ExtendsFileRestrictions(t *testing.T) {
	t.Parallel()

	const forbidden = "reading a file from the host is disabled for non administrator users"

	root := t.TempDir()
	projectDir := filesystem.JoinPaths(root, "project")
	outsideDir := filesystem.JoinPaths(root, "outside")

	err := os.MkdirAll(projectDir, 0700)
	require.NoError(t, err)

	err = os.MkdirAll(outsideDir, 0700)
	require.NoError(t, err)

	baseContent := []byte("services:\n  base:\n    image: nginx\n")

	err = os.WriteFile(filesystem.JoinPaths(projectDir, "base.yml"), baseContent, 0600)
	require.NoError(t, err)

	outsideFile := filesystem.JoinPaths(outsideDir, "base.yml")
	err = os.WriteFile(outsideFile, baseContent, 0600)
	require.NoError(t, err)

	f := func(yamlContent []byte, allowBindMounts bool, wantErrSubstring string) {
		t.Helper()

		err := IsValidStackFile(StackFileValidationConfig{
			Content:          yamlContent,
			SecuritySettings: &portainer.EndpointSecuritySettings{AllowBindMountsForRegularUsers: allowBindMounts},
			WorkingDir:       projectDir,
			ProjectPath:      projectDir,
		})

		if wantErrSubstring == "" {
			require.NoError(t, err)

			return
		}

		require.ErrorContains(t, err, wantErrSubstring)
	}

	// extends reading an absolute host path outside the project is rejected
	f([]byte(`
services:
  api:
    extends:
      file: `+outsideFile+`
      service: base
`), false, forbidden)

	// extends climbing out of the stack directory is contained inside the
	// project directory instead of escaping it, so it fails as a missing file
	// rather than as an explicit rejection
	err = IsValidStackFile(StackFileValidationConfig{
		Content: []byte(`
services:
  api:
    extends:
      file: ../outside/base.yml
      service: base
`),
		SecuritySettings: &portainer.EndpointSecuritySettings{AllowBindMountsForRegularUsers: false},
		WorkingDir:       projectDir,
		ProjectPath:      projectDir,
	})
	require.Error(t, err)

	// extends targeting a file shipped with the stack keeps working
	f([]byte(`
services:
  api:
    extends:
      file: ./base.yml
      service: base
`), false, "")

	// extends targeting a service within the same file keeps working
	f([]byte(`
services:
  base:
    image: nginx
  api:
    extends:
      service: base
`), false, "")

	// administrators are still allowed to read host paths
	f([]byte(`
services:
  api:
    extends:
      file: `+outsideFile+`
      service: base
`), true, "")
}

func TestIsValidStackFile_ConfigFileOutsideEntrypointDirButInsideProject(t *testing.T) {
	t.Parallel()

	const projectPath = "/data/compose/42"
	const workingDir = projectPath + "/envs/prod"
	const forbidden = "reading a file from the host is disabled for non administrator users"

	f := func(fileRef, wantErrSubstring string) {
		t.Helper()

		content := []byte(`
services:
  api:
    image: nginx
    configs:
      - c

configs:
  c:
    file: ` + fileRef + `
`)

		err := IsValidStackFile(StackFileValidationConfig{
			Content:          content,
			SecuritySettings: &portainer.EndpointSecuritySettings{AllowBindMountsForRegularUsers: false},
			WorkingDir:       workingDir,
			ProjectPath:      projectPath,
		})

		if wantErrSubstring == "" {
			require.NoError(t, err)

			return
		}

		require.ErrorContains(t, err, wantErrSubstring)
	}

	// entry point lives in envs/prod; a sibling directory under the project root is allowed
	f("../shared/secret.txt", "")

	// climbing past the project root is still rejected
	f("../../../../etc/shadow", forbidden)
}

// TestCheckFileObjectSource_RelativeFileFailsClosed guards the assumption that
// compose-go always resolves a config/secret file: value to absolute before
// IsValidStackFile sees it. filepath.Rel errors when comparing an absolute
// projectPath against a relative file, and that error is treated as a rejection,
// so an unresolved relative path fails closed instead of being silently accepted.
func TestCheckFileObjectSource_RelativeFileFailsClosed(t *testing.T) {
	t.Parallel()

	const projectPath = "/data/compose/17"
	const forbidden = "reading a file from the host is disabled for non administrator users"

	f := func(file, wantErrSubstring string) {
		t.Helper()

		err := checkFileObjectSource("config", "c", file, projectPath)

		if wantErrSubstring == "" {
			require.NoError(t, err)

			return
		}

		require.ErrorContains(t, err, wantErrSubstring)
	}

	// a relative file, unresolved against projectPath, can't be proven safe
	f("nginx.conf", forbidden)

	// a relative escape attempt is rejected the same way
	f("../../etc/shadow", forbidden)

	// an absolute file that resolves inside projectPath is still allowed
	f(projectPath+"/nginx.conf", "")
}

func TestExtractImageRegistry(t *testing.T) {
	t.Parallel()

	cases := []struct {
		image    string
		expected string
	}{
		{"nginx", ""},
		{"nginx:latest", ""},
		{"library/nginx", ""},
		{"ghcr.io/owner/image:tag", "ghcr.io"},
		{"myregistry.com/image:tag", "myregistry.com"},
		{"myregistry.com:5000/image:tag", "myregistry.com:5000"},
		{"localhost/image:tag", "localhost"},
		{"localhost:5000/image:tag", "localhost:5000"},
		{"myregistry.com/image@sha256:abc", "myregistry.com"},
		{"169.254.169.254/image:tag", "169.254.169.254"},
	}

	for _, tc := range cases {
		got := extractImageRegistry(tc.image)
		require.Equal(t, tc.expected, got, "image: %s", tc.image)
	}
}

type staticAllowListService struct {
	parsed portainer.ParsedAllowList
}

func (s *staticAllowListService) ReadParsed(id portainer.AllowListKey) (*portainer.ParsedAllowList, error) {
	return &s.parsed, nil
}

func configureSSRF(t *testing.T, mode portainer.SSRFMode, entries []string) {
	t.Helper()

	parsed := ssrf.ParseAllowedHosts(entries)
	parsed.Mode = mode
	err := ssrf.Configure(&staticAllowListService{parsed: parsed})
	require.NoError(t, err)
	t.Cleanup(func() {
		err := ssrf.Configure(&staticAllowListService{})
		require.NoError(t, err)
	})
}

func TestValidateComposeURLs_DisabledSSRF(t *testing.T) {
	configureSSRF(t, portainer.SSRFModeOff, nil)

	stack := &portainer.Stack{
		ProjectPath: "/tmp/stack/1",
		EntryPoint:  "docker-compose.yml",
	}

	fileService := mockFileService{
		fileContent: []byte(`
version: "3"
services:
  web:
    build:
      context: http://169.254.169.254/repo.tar.gz
`),
		projectVersionPath: "/tmp/stack/1",
	}

	err := ValidateComposeURLs(t.Context(), stack, fileService)
	require.NoError(t, err)
}

func TestValidateComposeURLs_BuildContextBlocked(t *testing.T) {
	configureSSRF(t, portainer.SSRFModeEnforce, []string{"example.com"})

	stack := &portainer.Stack{
		ProjectPath: "/tmp/stack/1",
		EntryPoint:  "docker-compose.yml",
	}

	fileService := mockFileService{
		fileContent: []byte(`
version: "3"
services:
  web:
    build:
      context: http://169.254.169.254/repo.tar.gz
    image: nginx
`),
		projectVersionPath: "/tmp/stack/1",
	}

	err := ValidateComposeURLs(t.Context(), stack, fileService)
	require.ErrorContains(t, err, "SSRF policy")
}

func TestValidateComposeURLs_BuildContextPath(t *testing.T) {
	configureSSRF(t, portainer.SSRFModeEnforce, []string{"example.com"})

	stack := &portainer.Stack{
		ProjectPath: "/tmp/stack/1",
		EntryPoint:  "docker-compose.yml",
	}

	fileService := mockFileService{
		fileContent: []byte(`
version: "3"
services:
  web:
    build:
      context: ./app
    image: nginx
`),
		projectVersionPath: "/tmp/stack/1",
	}

	err := ValidateComposeURLs(t.Context(), stack, fileService)
	require.NoError(t, err)
}

func TestValidateComposeURLs_ImageRegistryBlocked(t *testing.T) {
	configureSSRF(t, portainer.SSRFModeEnforce, []string{"example.com"})

	stack := &portainer.Stack{
		ProjectPath: "/tmp/stack/1",
		EntryPoint:  "docker-compose.yml",
	}

	fileService := mockFileService{
		fileContent: []byte(`
version: "3"
services:
  web:
    image: 169.254.169.254/myimage:latest
`),
		projectVersionPath: "/tmp/stack/1",
	}

	err := ValidateComposeURLs(t.Context(), stack, fileService)
	require.ErrorContains(t, err, "SSRF policy")
}

func TestValidateComposeURLs_ImageRegistryAllowed(t *testing.T) {
	configureSSRF(t, portainer.SSRFModeEnforce, []string{"myregistry.com"})

	stack := &portainer.Stack{
		ProjectPath: "/tmp/stack/1",
		EntryPoint:  "docker-compose.yml",
	}

	fileService := mockFileService{
		fileContent: []byte(`
version: "3"
services:
  web:
    image: myregistry.com/myimage:latest
`),
		projectVersionPath: "/tmp/stack/1",
	}

	err := ValidateComposeURLs(t.Context(), stack, fileService)
	require.NoError(t, err)
}

func TestValidateComposeURLs_InvalidStackEnv(t *testing.T) {
	configureSSRF(t, portainer.SSRFModeEnforce, []string{"example.com"})

	stack := &portainer.Stack{
		ProjectPath: "/tmp/stack/1",
		EntryPoint:  "docker-compose.yml",
		Env:         []portainer.Pair{{Name: "API_PORT", Value: `"unterminated`}},
	}

	fileService := mockFileService{
		fileContent: []byte(`
version: "3"
services:
  web:
    image: nginx
`),
		projectVersionPath: "/tmp/stack/1",
	}

	err := ValidateComposeURLs(t.Context(), stack, fileService)
	require.ErrorContains(t, err, "failed to build stack environment variables")
}

func TestValidateComposeURLs_DockerHubImageAllowed(t *testing.T) {
	configureSSRF(t, portainer.SSRFModeEnforce, []string{"example.com"})

	stack := &portainer.Stack{
		ProjectPath: "/tmp/stack/1",
		EntryPoint:  "docker-compose.yml",
	}

	fileService := mockFileService{
		fileContent: []byte(`
version: "3"
services:
  web:
    image: nginx:latest
`),
		projectVersionPath: "/tmp/stack/1",
	}

	err := ValidateComposeURLs(t.Context(), stack, fileService)
	require.NoError(t, err)
}
