package stackutils

import (
	"errors"
	"os"
	"path/filepath"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/pkg/libhttp/ssrf"

	"github.com/stretchr/testify/require"
)

// staticAllowListService is a minimal ssrf.AllowListService for testing SSRF-gated
// validation without touching the real datastore.
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
		err := ssrf.Configure(&staticAllowListService{parsed: portainer.ParsedAllowList{Mode: portainer.SSRFModeOff}})
		require.NoError(t, err)
	})
}

type errorFileService struct {
	portainer.FileService
}

func (errorFileService) GetFileContent(trustedRootPath, filePath string) ([]byte, error) {
	return nil, errors.New("file read failed")
}

func TestIsValidStackFile_DefaultPortEnvSubstitution(t *testing.T) {
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
	err := ValidateStackFiles(stack, securitySettings, fileService)
	require.NoError(t, err)
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
	err := ValidateStackFiles(stack, securitySettings, fileService)
	require.NoError(t, err)
}

func TestValidateStackFiles_DotEnvFile(t *testing.T) {
	tmpDir := t.TempDir()

	err := os.WriteFile(filepath.Join(tmpDir, ".env"), []byte("HOST_PORT=3000\n"), 0600)
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
	err = ValidateStackFiles(stack, securitySettings, fileService)
	require.NoError(t, err)
}

func TestValidateStackFiles_EnvFileAttribute(t *testing.T) {
	tmpDir := t.TempDir()

	err := os.WriteFile(filepath.Join(tmpDir, "web.env"), []byte("HOST_PORT=3000\n"), 0600)
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
	err = ValidateStackFiles(stack, securitySettings, fileService)
	require.NoError(t, err)
}

func TestValidateStackFiles_BindMountBlockedForNonAdmin(t *testing.T) {
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
	err := ValidateStackFiles(stack, securitySettings, fileService)
	require.ErrorContains(t, err, "bind-mount disabled for non administrator users")
}

func TestValidateComposeURLs_SSRFDisabled(t *testing.T) {
	configureSSRF(t, portainer.SSRFModeOff, nil)

	stack := &portainer.Stack{
		ProjectPath: "/tmp/stack/1",
		EntryPoint:  "docker-compose.yml",
	}

	fileService := errorFileService{}

	err := ValidateComposeURLs(t.Context(), stack, fileService)
	require.NoError(t, err)
}

func TestValidateComposeURLs_FileServiceError(t *testing.T) {
	configureSSRF(t, portainer.SSRFModeEnforce, nil)

	stack := &portainer.Stack{
		ProjectPath: "/tmp/stack/1",
		EntryPoint:  "docker-compose.yml",
	}

	fileService := errorFileService{}

	err := ValidateComposeURLs(t.Context(), stack, fileService)
	require.ErrorContains(t, err, "failed to get stack file content")
}

func TestValidateComposeURLs_BuildContextBlocked(t *testing.T) {
	configureSSRF(t, portainer.SSRFModeEnforce, nil)

	fileContent := []byte(`
version: "3"
services:
  api:
    build:
      context: http://169.254.169.254/build
`)

	stack := &portainer.Stack{
		ProjectPath: "/tmp/stack/1",
		EntryPoint:  "docker-compose.yml",
	}

	fileService := mockFileService{
		fileContent:        fileContent,
		projectVersionPath: "/tmp/stack/1",
	}

	err := ValidateComposeURLs(t.Context(), stack, fileService)
	require.ErrorContains(t, err, "stack file contains a URL blocked by the SSRF policy")
}

func TestValidateComposeURLs_ImageRegistryAllowed(t *testing.T) {
	configureSSRF(t, portainer.SSRFModeEnforce, []string{"registry.example.com"})

	fileContent := []byte(`
version: "3"
services:
  api:
    image: registry.example.com/team/api:latest
`)

	stack := &portainer.Stack{
		ProjectPath: "/tmp/stack/1",
		EntryPoint:  "docker-compose.yml",
	}

	fileService := mockFileService{
		fileContent:        fileContent,
		projectVersionPath: "/tmp/stack/1",
	}

	err := ValidateComposeURLs(t.Context(), stack, fileService)
	require.NoError(t, err)
}

func TestValidateComposeURLs_ImageRegistryBlocked(t *testing.T) {
	configureSSRF(t, portainer.SSRFModeEnforce, nil)

	fileContent := []byte(`
version: "3"
services:
  api:
    image: registry.internal.example/team/api:latest
`)

	stack := &portainer.Stack{
		ProjectPath: "/tmp/stack/1",
		EntryPoint:  "docker-compose.yml",
	}

	fileService := mockFileService{
		fileContent:        fileContent,
		projectVersionPath: "/tmp/stack/1",
	}

	err := ValidateComposeURLs(t.Context(), stack, fileService)
	require.ErrorContains(t, err, "stack file contains a URL blocked by the SSRF policy")
}

func TestValidateEdgeStackComposeContent_SSRFDisabled(t *testing.T) {
	configureSSRF(t, portainer.SSRFModeOff, nil)

	content := []byte(`
version: "3"
services:
  api:
    build:
      context: http://169.254.169.254/build
`)

	err := ValidateEdgeStackComposeContent(t.Context(), portainer.EdgeStackDeploymentCompose, content)
	require.NoError(t, err)
}

func TestValidateEdgeStackComposeContent_NonComposeDeploymentSkipsCheck(t *testing.T) {
	configureSSRF(t, portainer.SSRFModeEnforce, nil)

	content := []byte(`
version: "3"
services:
  api:
    build:
      context: http://169.254.169.254/build
`)

	err := ValidateEdgeStackComposeContent(t.Context(), portainer.EdgeStackDeploymentKubernetes, content)
	require.NoError(t, err)
}

func TestValidateEdgeStackComposeContent_BuildContextBlocked(t *testing.T) {
	configureSSRF(t, portainer.SSRFModeEnforce, nil)

	content := []byte(`
version: "3"
services:
  api:
    build:
      context: http://169.254.169.254/build
`)

	err := ValidateEdgeStackComposeContent(t.Context(), portainer.EdgeStackDeploymentCompose, content)
	require.ErrorContains(t, err, "stack file contains a URL blocked by the SSRF policy")
}

func TestValidateEdgeStackComposeContent_NoBlockedURLs(t *testing.T) {
	configureSSRF(t, portainer.SSRFModeEnforce, nil)

	content := []byte(`
version: "3"
services:
  api:
    image: nginx
`)

	err := ValidateEdgeStackComposeContent(t.Context(), portainer.EdgeStackDeploymentCompose, content)
	require.NoError(t, err)
}

func TestValidateEdgeStackComposeContent_InvalidComposeFile(t *testing.T) {
	configureSSRF(t, portainer.SSRFModeEnforce, nil)

	content := []byte("not: [valid: yaml")

	err := ValidateEdgeStackComposeContent(t.Context(), portainer.EdgeStackDeploymentCompose, content)
	require.Error(t, err)
}

func TestExtractImageRegistry(t *testing.T) {
	t.Parallel()

	cases := map[string]string{
		"nginx":                        "",
		"library/nginx":                "",
		"nginx@sha256:abcd1234":        "",
		"myregistry.example.com/nginx": "myregistry.example.com",
		"quay.io/coreos/etcd":          "quay.io",
		"localhost:5000/nginx":         "localhost:5000",
		"localhost/nginx":              "localhost",
		"myregistry.example.com/nginx@sha256:abcd1234": "myregistry.example.com",
	}

	for imageRef, expected := range cases {
		require.Equal(t, expected, extractImageRegistry(imageRef), "imageRef=%s", imageRef)
	}
}
