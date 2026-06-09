package stackutils

import (
	"os"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/pkg/libhttp/ssrf"
	"github.com/stretchr/testify/require"
)

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
	t.Parallel()
	tmpDir := t.TempDir()

	err := os.WriteFile(filesystem.JoinPaths(tmpDir, ".env"), []byte("HOST_PORT=3000\n"), 0600)
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
	t.Parallel()
	tmpDir := t.TempDir()

	err := os.WriteFile(filesystem.JoinPaths(tmpDir, "web.env"), []byte("HOST_PORT=3000\n"), 0600)
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
	err := ValidateStackFiles(stack, securitySettings, fileService)
	require.ErrorContains(t, err, "bind-mount disabled for non administrator users")
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

func TestValidateComposeURLs_DisabledSSRF(t *testing.T) {
	ssrf.Configure(ssrf.Policy{})

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
	ssrf.Configure(ssrf.Policy{Mode: ssrf.ModeEnforce, AllowedHosts: []string{"example.com"}})
	t.Cleanup(func() { ssrf.Configure(ssrf.Policy{}) })

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
	ssrf.Configure(ssrf.Policy{Mode: ssrf.ModeEnforce, AllowedHosts: []string{"example.com"}})
	t.Cleanup(func() { ssrf.Configure(ssrf.Policy{}) })

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
	ssrf.Configure(ssrf.Policy{Mode: ssrf.ModeEnforce, AllowedHosts: []string{"example.com"}})
	t.Cleanup(func() { ssrf.Configure(ssrf.Policy{}) })

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
	ssrf.Configure(ssrf.Policy{Mode: ssrf.ModeEnforce, AllowedHosts: []string{"myregistry.com"}})
	t.Cleanup(func() { ssrf.Configure(ssrf.Policy{}) })

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

func TestValidateComposeURLs_DockerHubImageAllowed(t *testing.T) {
	ssrf.Configure(ssrf.Policy{Mode: ssrf.ModeEnforce, AllowedHosts: []string{"example.com"}})
	t.Cleanup(func() { ssrf.Configure(ssrf.Policy{}) })

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
