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

	// with no Docker client, the existing-volume check is skipped and the stack is valid
	f([]byte(`
version: "3"

services:
  api:
    image: nginx
    volumes:
      - data:/var/lib/data

volumes:
  data: {}
`), "mystack", nil, "")

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
