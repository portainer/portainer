package compose

import (
	"context"
	"errors"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"testing"

	"github.com/compose-spec/compose-go/v2/consts"
	"github.com/compose-spec/compose-go/v2/types"
	"github.com/docker/cli/cli/command"
	"github.com/docker/cli/cli/config"
	configtypes "github.com/docker/cli/cli/config/types"
	cmdcompose "github.com/docker/compose/v2/cmd/compose"
	"github.com/docker/compose/v2/pkg/api"
	"github.com/docker/compose/v2/pkg/compose"
	"github.com/google/go-cmp/cmp"
	"github.com/portainer/portainer/pkg/libstack"
	zerolog "github.com/rs/zerolog/log"

	"github.com/stretchr/testify/require"
)

func Test_UpAndDown(t *testing.T) {
	const projectName = "composetest"

	const composeFileContent = `
services:
  busybox:
    image: "alpine:3.7"
    container_name: "composetest_container_one"`

	const overrideComposeFileContent = `
services:
  busybox:
    image: "alpine:latest"
    container_name: "composetest_container_two"`

	composeContainerName := projectName + "_container_two"

	w := NewComposeDeployer()

	dir := t.TempDir()

	filePathOriginal := createFile(t, dir, "docker-compose.yml", composeFileContent)
	filePathOverride := createFile(t, dir, "docker-compose-override.yml", overrideComposeFileContent)

	filePaths := []string{filePathOriginal, filePathOverride}

	ctx := context.Background()

	err := w.Validate(ctx, filePaths, libstack.Options{ProjectName: projectName})
	require.NoError(t, err)

	err = w.Pull(ctx, filePaths, libstack.Options{ProjectName: projectName})
	require.NoError(t, err)

	require.False(t, containerExists(composeContainerName))

	err = w.Deploy(ctx, filePaths, libstack.DeployOptions{
		Options: libstack.Options{
			ProjectName: projectName,
		},
	})
	require.NoError(t, err)

	require.True(t, containerExists(composeContainerName))

	waitResult := w.WaitForStatus(ctx, projectName, libstack.StatusCompleted)

	require.Empty(t, waitResult.ErrorMsg)
	require.Equal(t, libstack.StatusCompleted, waitResult.Status)

	err = w.Remove(ctx, projectName, filePaths, libstack.RemoveOptions{})
	require.NoError(t, err)

	require.False(t, containerExists(composeContainerName))
}

// Detect regression in container injections.
// Ref BE-12432
// Ref https://github.com/portainer/portainer/issues/12909
func Test_UpAndDownWithInjection(t *testing.T) {
	const content = `
services:
  test:
    image: alpine:latest
    container_name: "composetest_alpine"
    command: ["sh", "-c", "cat /test.txt"]
    configs:
      - source: test-config
        target: /test.txt

configs:
  test-config:
    content: |
      Hello from inline config!
      This should appear in the container.
`
	const projectName = "composetest"
	const containerName = "composetest_alpine"
	w := NewComposeDeployer()

	dir := t.TempDir()
	ctx := context.Background()

	filePath := createFile(t, dir, "docker-compose.yml", content)
	filePaths := []string{filePath}

	err := w.Validate(ctx, filePaths, libstack.Options{ProjectName: projectName})
	require.NoError(t, err)

	err = w.Pull(ctx, filePaths, libstack.Options{ProjectName: projectName})
	require.NoError(t, err)

	require.False(t, containerExists(containerName))

	err = w.Deploy(ctx, filePaths, libstack.DeployOptions{
		Options: libstack.Options{
			ProjectName: projectName,
		},
	})
	require.NoError(t, err)

	require.True(t, containerExists(containerName))

	waitResult := w.WaitForStatus(ctx, projectName, libstack.StatusCompleted)

	require.Empty(t, waitResult.ErrorMsg)
	require.Equal(t, libstack.StatusCompleted, waitResult.Status)

	err = w.Remove(ctx, projectName, filePaths, libstack.RemoveOptions{})
	require.NoError(t, err)

	require.False(t, containerExists(containerName))

}

func TestRun(t *testing.T) {
	w := NewComposeDeployer()

	filePath := createFile(t, t.TempDir(), "docker-compose.yml", `
services:
  updater:
    image: alpine
`)

	filePaths := []string{filePath}
	serviceName := "updater"

	err := w.Run(context.Background(), filePaths, serviceName, libstack.RunOptions{
		Remove: true,
		Options: libstack.Options{
			ProjectName: "project_name",
		},
	})
	require.NoError(t, err)
}

func createFile(t *testing.T, dir, fileName, content string) string {
	filePath := filepath.Join(dir, fileName)

	err := os.WriteFile(filePath, []byte(content), 0o644)
	require.NoError(t, err)

	return filePath
}

func containerExists(containerName string) bool {
	cmd := exec.Command("docker", "ps", "-a", "-f", "name="+containerName)

	out, err := cmd.Output()
	if err != nil {
		log.Fatalf("failed to list containers: %s", err)
	}

	return strings.Contains(string(out), containerName)
}

func Test_Validate(t *testing.T) {
	invalidComposeFileContent := `invalid-file-content`

	w := NewComposeDeployer()

	dir := t.TempDir()

	filePathOriginal := createFile(t, dir, "docker-compose.yml", invalidComposeFileContent)

	filePaths := []string{filePathOriginal}

	projectName := "plugintest"

	ctx := context.Background()

	err := w.Validate(ctx, filePaths, libstack.Options{ProjectName: projectName})
	require.Error(t, err)
}

func Test_Config(t *testing.T) {
	ctx := context.Background()
	dir := t.TempDir()
	projectName := "configtest"

	defer func() {
		err := os.RemoveAll(dir)
		require.NoError(t, err)
	}()

	testCases := []struct {
		name               string
		composeFileContent string
		expectFileContent  string
		envFileContent     string
		env                []string
	}{
		{
			name: "compose file with relative path",
			composeFileContent: `services:
  app:
    image: 'nginx:latest'
    ports:
      - '80:80'
    volumes:
      - ./nginx-data:/data`,
			expectFileContent: `name: configtest
services:
  app:
    image: nginx:latest
    networks:
      default: null
    ports:
      - mode: ingress
        target: 80
        published: "80"
        protocol: tcp
    volumes:
      - type: bind
        source: ./nginx-data
        target: /data
        bind:
          create_host_path: true
networks:
  default:
    name: configtest_default
`,
		},
		{
			name: "compose file with absolute path",
			composeFileContent: `services:
  app:
    image: 'nginx:latest'
    ports:
      - '80:80'
    volumes:
      - /nginx-data:/data`,
			expectFileContent: `name: configtest
services:
  app:
    image: nginx:latest
    networks:
      default: null
    ports:
      - mode: ingress
        target: 80
        published: "80"
        protocol: tcp
    volumes:
      - type: bind
        source: /nginx-data
        target: /data
        bind:
          create_host_path: true
networks:
  default:
    name: configtest_default
`,
		},
		{
			name: "compose file with declared volume",
			composeFileContent: `services:
  app:
    image: 'nginx:latest'
    ports:
      - '80:80'
    volumes:
      - nginx-data:/data
volumes:
  nginx-data:
    driver: local`,
			expectFileContent: `name: configtest
services:
  app:
    image: nginx:latest
    networks:
      default: null
    ports:
      - mode: ingress
        target: 80
        published: "80"
        protocol: tcp
    volumes:
      - type: volume
        source: nginx-data
        target: /data
        volume: {}
networks:
  default:
    name: configtest_default
volumes:
  nginx-data:
    name: configtest_nginx-data
    driver: local
`,
		},
		{
			name: "compose file with relative path environment variable placeholder",
			composeFileContent: `services:
  nginx:
    image: nginx:latest
    ports:
      - 8019:80
    volumes:
      - ${WEB_HOME}:/usr/share/nginx/html/
      - ./config/${CONFIG_DIR}:/tmp/config
    env_file:
      - stack.env
`,
			expectFileContent: `name: configtest
services:
  nginx:
    environment:
      WEB_HOME: ./html
    image: nginx:latest
    networks:
      default: null
    ports:
      - mode: ingress
        target: 80
        published: "8019"
        protocol: tcp
    volumes:
      - type: bind
        source: ./html
        target: /usr/share/nginx/html
        bind:
          create_host_path: true
      - type: bind
        source: ./config/something
        target: /tmp/config
        bind:
          create_host_path: true
networks:
  default:
    name: configtest_default
`,
			envFileContent: `WEB_HOME=./html`,
			env:            []string{"CONFIG_DIR=something"},
		},
		{
			name: "compose file with absolute path environment variable placeholder",
			composeFileContent: `services:
  nginx:
    image: nginx:latest
    ports:
      - 8019:80
    volumes:
      - ${WEB_HOME}:/usr/share/nginx/html/
    env_file:
      - stack.env
`,
			expectFileContent: `name: configtest
services:
  nginx:
    environment:
      WEB_HOME: /usr/share/nginx/html
    image: nginx:latest
    networks:
      default: null
    ports:
      - mode: ingress
        target: 80
        published: "8019"
        protocol: tcp
    volumes:
      - type: bind
        source: /usr/share/nginx/html
        target: /usr/share/nginx/html
        bind:
          create_host_path: true
networks:
  default:
    name: configtest_default
`,
			envFileContent: `WEB_HOME=/usr/share/nginx/html`,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			composeFilePath := createFile(t, dir, "docker-compose.yml", tc.composeFileContent)

			envFilePath := ""
			if tc.envFileContent != "" {
				envFilePath = createFile(t, dir, "stack.env", tc.envFileContent)
			}

			w := NewComposeDeployer()
			actual, err := w.Config(ctx, []string{composeFilePath}, libstack.Options{
				WorkingDir:    dir,
				ProjectName:   projectName,
				EnvFilePath:   envFilePath,
				Env:           tc.env,
				ConfigOptions: []string{"--no-path-resolution"},
			})
			require.NoError(t, err)

			require.Equal(t, tc.expectFileContent, string(actual))
		})
	}
}

func Test_DeployWithRemoveOrphans(t *testing.T) {
	const projectName = "compose_remove_orphans_test"

	const composeFileContent = `services:
  service-1:
    image: alpine:latest
  service-2:
    image: alpine:latest`

	const modifiedFileContent = `services:
  service-2:
    image: alpine:latest`

	service1ContainerName := projectName + "-service-1"
	service2ContainerName := projectName + "-service-2"

	w := NewComposeDeployer()

	dir := t.TempDir()

	composeFilepath := createFile(t, dir, "docker-compose.yml", composeFileContent)
	modifiedComposeFilepath := createFile(t, dir, "docker-compose-modified.yml", modifiedFileContent)

	filepaths := []string{composeFilepath}
	modifiedFilepaths := []string{modifiedComposeFilepath}

	ctx := context.Background()

	testCases := []struct {
		name    string
		options libstack.DeployOptions
	}{
		{
			name: "Remove Orphans in env",
			options: libstack.DeployOptions{
				Options: libstack.Options{
					ProjectName: projectName,
					Env:         []string{cmdcompose.ComposeRemoveOrphans + "=true"},
				},
			},
		},
		{
			name: "Remove Orphans in options",
			options: libstack.DeployOptions{
				Options: libstack.Options{
					ProjectName: projectName,
				},
				RemoveOrphans: true,
			},
		},
		{
			name: "Remove Orphans in options and env",
			options: libstack.DeployOptions{
				Options: libstack.Options{
					ProjectName: projectName,
					Env:         []string{cmdcompose.ComposeRemoveOrphans + "=true"},
				},
				RemoveOrphans: false,
			},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			options := tc.options.Options

			err := w.Validate(ctx, filepaths, options)
			require.NoError(t, err)

			err = w.Pull(ctx, filepaths, options)
			require.NoError(t, err)

			require.False(t, containerExists(service1ContainerName))
			require.False(t, containerExists(service2ContainerName))

			err = w.Deploy(ctx, filepaths, tc.options)
			require.NoError(t, err)

			defer func() {
				err = w.Remove(ctx, projectName, filepaths, libstack.RemoveOptions{})
				require.NoError(t, err)

				require.False(t, containerExists(service1ContainerName))
				require.False(t, containerExists(service2ContainerName))
			}()

			require.True(t, containerExists(service1ContainerName))
			require.True(t, containerExists(service2ContainerName))

			waitResult := w.WaitForStatus(ctx, projectName, libstack.StatusCompleted)

			require.Empty(t, waitResult.ErrorMsg)
			require.Equal(t, libstack.StatusCompleted, waitResult.Status)

			err = w.Validate(ctx, modifiedFilepaths, options)
			require.NoError(t, err)

			err = w.Pull(ctx, modifiedFilepaths, options)
			require.NoError(t, err)

			require.True(t, containerExists(service1ContainerName))
			require.True(t, containerExists(service2ContainerName))

			err = w.Deploy(ctx, modifiedFilepaths, tc.options)
			require.NoError(t, err)

			require.False(t, containerExists(service1ContainerName))
			require.True(t, containerExists(service2ContainerName))

			waitResult = w.WaitForStatus(ctx, projectName, libstack.StatusCompleted)

			require.Empty(t, waitResult.ErrorMsg)
			require.Equal(t, libstack.StatusCompleted, waitResult.Status)
		})
	}
}

type logger struct {
	sync.Mutex
	strings.Builder
}

func (l *logger) Write(p []byte) (n int, err error) {
	l.Lock()
	defer l.Unlock()

	return l.Builder.Write(p)
}

func Test_DeployWithIgnoreOrphans(t *testing.T) {
	var logOutput logger
	oldLogger := zerolog.Logger
	zerolog.Logger = zerolog.Output(&logOutput)
	defer func() {
		zerolog.Logger = oldLogger
	}()

	const projectName = "compose_ignore_orphans_test"

	const composeFileContent = `services:
  service-1:
    image: alpine:latest
  service-2:
    image: alpine:latest`

	const modifiedFileContent = `services:
  service-2:
    image: alpine:latest`

	service1ContainerName := projectName + "-service-1"
	service2ContainerName := projectName + "-service-2"

	w := NewComposeDeployer()

	dir := t.TempDir()

	composeFilepath := createFile(t, dir, "docker-compose.yml", composeFileContent)
	modifiedComposeFilepath := createFile(t, dir, "docker-compose-modified.yml", modifiedFileContent)

	filepaths := []string{composeFilepath}
	modifiedFilepaths := []string{modifiedComposeFilepath}
	options := libstack.Options{
		ProjectName: projectName,
		Env:         []string{cmdcompose.ComposeIgnoreOrphans + "=true"},
	}

	ctx := context.Background()

	err := w.Validate(ctx, filepaths, options)
	require.NoError(t, err)

	err = w.Pull(ctx, filepaths, options)
	require.NoError(t, err)

	require.False(t, containerExists(service1ContainerName))
	require.False(t, containerExists(service2ContainerName))

	err = w.Deploy(ctx, filepaths, libstack.DeployOptions{Options: options})
	require.NoError(t, err)

	defer func() {
		err = w.Remove(ctx, projectName, filepaths, libstack.RemoveOptions{})
		require.NoError(t, err)

		require.False(t, containerExists(service1ContainerName))
		require.False(t, containerExists(service2ContainerName))
	}()

	require.True(t, containerExists(service1ContainerName))
	require.True(t, containerExists(service2ContainerName))

	waitResult := w.WaitForStatus(ctx, projectName, libstack.StatusCompleted)

	require.Empty(t, waitResult.ErrorMsg)
	require.Equal(t, libstack.StatusCompleted, waitResult.Status)

	err = w.Validate(ctx, modifiedFilepaths, options)
	require.NoError(t, err)

	err = w.Pull(ctx, modifiedFilepaths, options)
	require.NoError(t, err)

	require.True(t, containerExists(service1ContainerName))
	require.True(t, containerExists(service2ContainerName))

	err = w.Deploy(ctx, modifiedFilepaths, libstack.DeployOptions{Options: options})
	require.NoError(t, err)

	require.True(t, containerExists(service1ContainerName))
	require.True(t, containerExists(service2ContainerName))

	waitResult = w.WaitForStatus(ctx, projectName, libstack.StatusCompleted)

	require.Empty(t, waitResult.ErrorMsg)
	require.Equal(t, libstack.StatusCompleted, waitResult.Status)

	logString := logOutput.String()
	require.NotContains(t, logString, "Found orphan containers ([compose_ignore_orphans_test-service-1-1])")
}

func Test_MaxConcurrency(t *testing.T) {
	const projectName = "compose_max_concurrency_test"

	const composeFileContent = `services:
  service-1:
    image: alpine:latest`

	w := ComposeDeployer{
		createComposeServiceFn: createMockComposeService,
	}

	dir := t.TempDir()

	composeFilepath := createFile(t, dir, "docker-compose.yml", composeFileContent)

	expectedMaxConcurrency := 4

	filepaths := []string{composeFilepath}
	options := libstack.Options{
		ProjectName: projectName,
		Env:         []string{cmdcompose.ComposeParallelLimit + "=" + strconv.Itoa(expectedMaxConcurrency)},
	}

	ctx := context.Background()

	err := w.Validate(ctx, filepaths, options)
	require.NoError(t, err)

	err = w.withComposeService(ctx, filepaths, options, func(service api.Compose, _ *types.Project) error {
		if mockS, ok := service.(*mockComposeService); ok {
			require.Equal(t, expectedMaxConcurrency, mockS.maxConcurrency)
		} else {
			t.Fatalf("Expected mockComposeService but got %T", service)
		}
		return nil
	})
	require.NoError(t, err)
}

func Test_createProject(t *testing.T) {
	ctx := context.Background()
	dir := t.TempDir()
	projectName := "create-project-test"

	defer func() {
		err := os.RemoveAll(dir)
		if err != nil {
			t.Fatalf("Failed to remove temp dir: %v", err)
		}
	}()

	createTestLibstackOptions := func(workingDir, projectName string, env []string, envFilepath string) libstack.Options {
		return libstack.Options{
			WorkingDir:  workingDir,
			ProjectName: projectName,
			Env:         env,
			EnvFilePath: envFilepath,
		}
	}
	testSimpleComposeConfig := `services:
  nginx:
    container_name: nginx
    image: nginx:latest`

	expectedSimpleComposeProject := func(workingDirectory string, envOverrides map[string]string) *types.Project {
		env := types.Mapping{consts.ComposeProjectName: "create-project-test"}
		env = env.Merge(envOverrides)

		if workingDirectory == "" {
			workingDirectory = dir
		}

		if !filepath.IsAbs(workingDirectory) {
			absWorkingDir, err := filepath.Abs(workingDirectory)
			if err != nil {
				t.Fatalf("Failed to get absolute path of working directory (%s): %v", workingDirectory, err)
			}
			workingDirectory = absWorkingDir
		}

		return &types.Project{
			Name:       projectName,
			WorkingDir: workingDirectory,
			Services: types.Services{
				"nginx": {
					Name:          "nginx",
					ContainerName: "nginx",
					Environment:   types.MappingWithEquals{},
					Image:         "nginx:latest",
					Networks:      map[string]*types.ServiceNetworkConfig{"default": nil},
				},
			},
			Networks: types.Networks{"default": {Name: "create-project-test_default"}},
			ComposeFiles: []string{
				dir + "/docker-compose.yml",
			},
			Environment:      env,
			DisabledServices: types.Services{},
			Profiles:         []string{""},
		}
	}

	testComposeProfilesConfig := `services:
  nginx:
    container_name: nginx
    image: nginx:latest
    profiles: ['web1']
  apache:
    container_name: apache
    image: httpd:latest
    profiles: ['web2']`

	expectedComposeProfilesProject := func(envOverrides map[string]string) *types.Project {
		env := types.Mapping{consts.ComposeProfiles: "web1", consts.ComposeProjectName: "create-project-test"}
		env = env.Merge(envOverrides)

		return &types.Project{
			Name:       projectName,
			WorkingDir: dir,
			Services: types.Services{
				"nginx": {
					Name:          "nginx",
					Profiles:      []string{"web1"},
					ContainerName: "nginx",
					Environment:   types.MappingWithEquals{},
					Image:         "nginx:latest",
					Networks:      map[string]*types.ServiceNetworkConfig{"default": nil},
				},
			},
			Networks: types.Networks{"default": {Name: "create-project-test_default"}},
			ComposeFiles: []string{
				dir + "/docker-compose.yml",
			},
			Environment: env,
			DisabledServices: types.Services{
				"apache": {
					Name:          "apache",
					Profiles:      []string{"web2"},
					ContainerName: "apache",
					Environment:   nil,
					Image:         "httpd:latest",
					Networks:      map[string]*types.ServiceNetworkConfig{"default": nil},
				},
			},
			Profiles: []string{"web1"},
		}
	}

	testcases := []struct {
		name            string
		filesToCreate   map[string]string
		configFilepaths []string
		options         libstack.Options
		osEnv           map[string]string
		expectedProject *types.Project
	}{
		{
			name: "Compose profiles in env",
			filesToCreate: map[string]string{
				"docker-compose.yml": testComposeProfilesConfig,
			},
			configFilepaths: []string{dir + "/docker-compose.yml"},
			options:         createTestLibstackOptions(dir, projectName, []string{consts.ComposeProfiles + "=web1"}, ""),
			expectedProject: expectedComposeProfilesProject(nil),
		},
		{
			name: "Compose profiles in env file",
			filesToCreate: map[string]string{
				"docker-compose.yml": testComposeProfilesConfig,
				"stack.env":          consts.ComposeProfiles + "=web1",
			},
			configFilepaths: []string{dir + "/docker-compose.yml"},
			options:         createTestLibstackOptions(dir, projectName, nil, dir+"/stack.env"),
			expectedProject: expectedComposeProfilesProject(nil),
		},
		{
			name: "Compose profiles in env file in COMPOSE_ENV_FILES",
			filesToCreate: map[string]string{
				"docker-compose.yml": testComposeProfilesConfig,
				"stack.env":          consts.ComposeProfiles + "=web1",
			},
			configFilepaths: []string{dir + "/docker-compose.yml"},
			options:         createTestLibstackOptions(dir, projectName, []string{cmdcompose.ComposeEnvFiles + "=" + dir + "/stack.env"}, ""),
			expectedProject: expectedComposeProfilesProject(map[string]string{
				cmdcompose.ComposeEnvFiles: dir + "/stack.env",
			}),
		},
		{
			name: "Compose profiles in both env and env file",
			filesToCreate: map[string]string{
				"docker-compose.yml": testComposeProfilesConfig,
				"stack.env":          consts.ComposeProfiles + "=web2",
			},
			configFilepaths: []string{dir + "/docker-compose.yml"},
			options:         createTestLibstackOptions(dir, projectName, []string{consts.ComposeProfiles + "=web1"}, dir+"/stack.env"),
			expectedProject: expectedComposeProfilesProject(nil),
		},
		{
			name: "Compose project name in both options and env",
			filesToCreate: map[string]string{
				"docker-compose.yml": testSimpleComposeConfig,
			},
			configFilepaths: []string{dir + "/docker-compose.yml"},
			options:         createTestLibstackOptions(dir, projectName, []string{consts.ComposeProjectName + "=totally_different_name"}, ""),
			expectedProject: expectedSimpleComposeProject("", nil),
		},
		{
			name: "Compose project name in only env",
			filesToCreate: map[string]string{
				"docker-compose.yml": testSimpleComposeConfig,
			},
			configFilepaths: []string{dir + "/docker-compose.yml"},
			options:         createTestLibstackOptions(dir, "", []string{consts.ComposeProjectName + "=totally_different_name"}, ""),
			expectedProject: &types.Project{
				Name:       "totally_different_name",
				WorkingDir: dir,
				Services: types.Services{
					"nginx": {
						Name:          "nginx",
						ContainerName: "nginx",
						Environment:   types.MappingWithEquals{},
						Image:         "nginx:latest",
						Networks:      map[string]*types.ServiceNetworkConfig{"default": nil},
					},
				},
				Networks: types.Networks{"default": {Name: "totally_different_name_default"}},
				ComposeFiles: []string{
					dir + "/docker-compose.yml",
				},
				Environment:      types.Mapping{consts.ComposeProjectName: "totally_different_name"},
				DisabledServices: types.Services{},
				Profiles:         []string{""},
			},
		},
		{
			name: "Compose files in env",
			filesToCreate: map[string]string{
				"docker-compose.yml": testSimpleComposeConfig,
			},
			configFilepaths: nil,
			options:         createTestLibstackOptions(dir, projectName, []string{consts.ComposeFilePath + "=" + dir + "/docker-compose.yml"}, ""),
			expectedProject: expectedSimpleComposeProject("", map[string]string{
				consts.ComposeFilePath: dir + "/docker-compose.yml",
			}),
		},
		{
			name: "Compose files in both options and env",
			filesToCreate: map[string]string{
				"docker-compose.yml":          testSimpleComposeConfig,
				"profiles-docker-compose.yml": testComposeProfilesConfig,
			},
			configFilepaths: []string{dir + "/docker-compose.yml"},
			options:         createTestLibstackOptions(dir, projectName, []string{consts.ComposeFilePath + "=" + dir + "/profiles-docker-compose.yml"}, ""),
			expectedProject: expectedSimpleComposeProject("", map[string]string{
				consts.ComposeFilePath: dir + "/profiles-docker-compose.yml",
			}),
		},
		{
			name: "Multiple Compose files in options",
			filesToCreate: map[string]string{
				"docker-compose-0.yml": `services:
  nginx:
    container_name: nginx
    image: nginx:latest`,
				"docker-compose-1.yml": `services:
  apache:
    container_name: apache
    image: httpd:latest`,
			},
			configFilepaths: []string{dir + "/docker-compose-0.yml", dir + "/docker-compose-1.yml"},
			options:         createTestLibstackOptions(dir, projectName, []string{}, ""),
			expectedProject: &types.Project{
				Name:       projectName,
				WorkingDir: dir,
				Services: types.Services{
					"nginx": {
						Name:          "nginx",
						ContainerName: "nginx",
						Environment:   types.MappingWithEquals{},
						Image:         "nginx:latest",
						Networks:      map[string]*types.ServiceNetworkConfig{"default": nil},
					},
					"apache": {
						Name:          "apache",
						ContainerName: "apache",
						Environment:   types.MappingWithEquals{},
						Image:         "httpd:latest",
						Networks:      map[string]*types.ServiceNetworkConfig{"default": nil},
					},
				},
				Networks: types.Networks{"default": {Name: "create-project-test_default"}},
				ComposeFiles: []string{
					dir + "/docker-compose-0.yml",
					dir + "/docker-compose-1.yml",
				},
				Environment:      types.Mapping{consts.ComposeProjectName: "create-project-test"},
				DisabledServices: types.Services{},
				Profiles:         []string{""},
			},
		},
		{
			name: "Multiple Compose files in env",
			filesToCreate: map[string]string{
				"docker-compose-0.yml": `services:
  nginx:
    container_name: nginx
    image: nginx:latest`,
				"docker-compose-1.yml": `services:
  apache:
    container_name: apache
    image: httpd:latest`,
			},
			configFilepaths: nil,
			options:         createTestLibstackOptions(dir, projectName, []string{consts.ComposeFilePath + "=" + dir + "/docker-compose-0.yml:" + dir + "/docker-compose-1.yml"}, ""),
			expectedProject: &types.Project{
				Name:       projectName,
				WorkingDir: dir,
				Services: types.Services{
					"nginx": {
						Name:          "nginx",
						ContainerName: "nginx",
						Environment:   types.MappingWithEquals{},
						Image:         "nginx:latest",
						Networks:      map[string]*types.ServiceNetworkConfig{"default": nil},
					},
					"apache": {
						Name:          "apache",
						ContainerName: "apache",
						Environment:   types.MappingWithEquals{},
						Image:         "httpd:latest",
						Networks:      map[string]*types.ServiceNetworkConfig{"default": nil},
					},
				},
				Networks: types.Networks{"default": {Name: "create-project-test_default"}},
				ComposeFiles: []string{
					dir + "/docker-compose-0.yml",
					dir + "/docker-compose-1.yml",
				},
				Environment:      types.Mapping{consts.ComposeProjectName: "create-project-test", consts.ComposeFilePath: dir + "/docker-compose-0.yml:" + dir + "/docker-compose-1.yml"},
				DisabledServices: types.Services{},
				Profiles:         []string{""},
			},
		},
		{
			name: "Multiple Compose files in env with COMPOSE_PATH_SEPARATOR",
			filesToCreate: map[string]string{
				"docker-compose-0.yml": `services:
  nginx:
    container_name: nginx
    image: nginx:latest`,
				"docker-compose-1.yml": `services:
  apache:
    container_name: apache
    image: httpd:latest`,
			},
			configFilepaths: nil,
			options:         createTestLibstackOptions(dir, projectName, []string{consts.ComposePathSeparator + "=|", consts.ComposeFilePath + "=" + dir + "/docker-compose-0.yml|" + dir + "/docker-compose-1.yml"}, ""),
			expectedProject: &types.Project{
				Name:       projectName,
				WorkingDir: dir,
				Services: types.Services{
					"nginx": {
						Name:          "nginx",
						ContainerName: "nginx",
						Environment:   types.MappingWithEquals{},
						Image:         "nginx:latest",
						Networks:      map[string]*types.ServiceNetworkConfig{"default": nil},
					},
					"apache": {
						Name:          "apache",
						ContainerName: "apache",
						Environment:   types.MappingWithEquals{},
						Image:         "httpd:latest",
						Networks:      map[string]*types.ServiceNetworkConfig{"default": nil},
					},
				},
				Networks: types.Networks{"default": {Name: "create-project-test_default"}},
				ComposeFiles: []string{
					dir + "/docker-compose-0.yml",
					dir + "/docker-compose-1.yml",
				},
				Environment:      types.Mapping{consts.ComposeProjectName: "create-project-test", consts.ComposePathSeparator: "|", consts.ComposeFilePath: dir + "/docker-compose-0.yml|" + dir + "/docker-compose-1.yml"},
				DisabledServices: types.Services{},
				Profiles:         []string{""},
			},
		},
		{
			name: "compose ignore orphans",
			filesToCreate: map[string]string{
				"docker-compose.yml": testSimpleComposeConfig,
			},
			configFilepaths: []string{dir + "/docker-compose.yml"},
			options:         createTestLibstackOptions(dir, projectName, []string{cmdcompose.ComposeIgnoreOrphans + "=true"}, ""),
			expectedProject: expectedSimpleComposeProject("", map[string]string{
				cmdcompose.ComposeIgnoreOrphans: "true",
			}),
		},
		{
			name: "compose remove orphans",
			filesToCreate: map[string]string{
				"docker-compose.yml": testSimpleComposeConfig,
			},
			configFilepaths: []string{dir + "/docker-compose.yml"},
			options:         createTestLibstackOptions(dir, projectName, []string{cmdcompose.ComposeRemoveOrphans + "=true"}, ""),
			expectedProject: expectedSimpleComposeProject("", map[string]string{
				cmdcompose.ComposeRemoveOrphans: "true",
			}),
		},
		{
			name: "compose parallel limit",
			filesToCreate: map[string]string{
				"docker-compose.yml": testSimpleComposeConfig,
			},
			configFilepaths: []string{dir + "/docker-compose.yml"},
			options:         createTestLibstackOptions(dir, projectName, []string{cmdcompose.ComposeParallelLimit + "=true"}, ""),
			expectedProject: expectedSimpleComposeProject("", map[string]string{
				cmdcompose.ComposeParallelLimit: "true",
			}),
		},
		{
			name: "Absolute Working Directory",
			filesToCreate: map[string]string{
				"docker-compose.yml": testSimpleComposeConfig,
			},
			configFilepaths: []string{dir + "/docker-compose.yml"},
			options: libstack.Options{
				// Note that this is the execution working directory not the compose project working directory
				// and so it has no affect on the created projects working directory
				WorkingDir:  "/something-totally-different",
				ProjectName: projectName,
			},
			expectedProject: expectedSimpleComposeProject("", nil),
		},
		{
			name: "Relative Working Directory",
			filesToCreate: map[string]string{
				"docker-compose.yml": testSimpleComposeConfig,
			},
			configFilepaths: []string{dir + "/docker-compose.yml"},
			options: libstack.Options{
				// Note that this is the execution working directory not the compose project working directory
				// and so it has no affect on the created projects working directory
				WorkingDir:  "something-totally-different",
				ProjectName: projectName,
			},
			expectedProject: expectedSimpleComposeProject("", nil),
		},
		{
			name: "Absolute Project Directory",
			filesToCreate: map[string]string{
				"docker-compose.yml": testSimpleComposeConfig,
			},
			configFilepaths: []string{dir + "/docker-compose.yml"},
			options: libstack.Options{
				ProjectDir:  "/something-totally-different",
				ProjectName: projectName,
			},
			expectedProject: expectedSimpleComposeProject("/something-totally-different", nil),
		},
		{
			name: "Relative Project Directory",
			filesToCreate: map[string]string{
				"docker-compose.yml": testSimpleComposeConfig,
			},
			configFilepaths: []string{dir + "/docker-compose.yml"},
			options: libstack.Options{
				ProjectDir:  "something-totally-different",
				ProjectName: projectName,
			},
			expectedProject: expectedSimpleComposeProject("something-totally-different", nil),
		},
		{
			name: "Absolute Project and Working Directory set",
			filesToCreate: map[string]string{
				"docker-compose.yml": testSimpleComposeConfig,
			},
			configFilepaths: []string{dir + "/docker-compose.yml"},
			options: libstack.Options{
				WorkingDir:  "/working-dir",
				ProjectDir:  "/project-dir",
				ProjectName: projectName,
			},
			expectedProject: expectedSimpleComposeProject("/project-dir", nil),
		},
		{
			name: "OS Env Vars",
			filesToCreate: map[string]string{
				"docker-compose.yml": testSimpleComposeConfig,
			},
			configFilepaths: []string{dir + "/docker-compose.yml"},
			options: libstack.Options{
				ProjectName: projectName,
			},
			osEnv: map[string]string{
				"PORTAINER_WEB_FOLDER": "html-1",
				"other_var":            "something",
			},
			expectedProject: expectedSimpleComposeProject("", map[string]string{"PORTAINER_WEB_FOLDER": "html-1"}),
		},
		{
			name: "Env Vars in compose file, compose env file, env, os, and env_file",
			filesToCreate: map[string]string{
				"docker-compose.yml": `services:
  nginx:
    container_name: nginx
    image: nginx:latest
    env_file: ` + dir + `/compose-stack.env
    environment:
        PORTAINER_VAR: compose_file_environment`,
				"stack.env":         "PORTAINER_VAR=env_file",
				"compose-stack.env": "PORTAINER_VAR=compose_env_file",
			},
			configFilepaths: []string{dir + "/docker-compose.yml"},
			options: libstack.Options{
				ProjectName: projectName,
				Env:         []string{"PORTAINER_VAR=env"},
				EnvFilePath: dir + "/stack.env",
			},
			osEnv: map[string]string{
				"PORTAINER_VAR": "os",
			},
			expectedProject: &types.Project{
				Name:       projectName,
				WorkingDir: dir,
				Services: types.Services{
					"nginx": {
						Name:          "nginx",
						ContainerName: "nginx",
						Environment:   types.NewMappingWithEquals([]string{"PORTAINER_VAR=compose_file_environment"}),
						Image:         "nginx:latest",
						Networks:      map[string]*types.ServiceNetworkConfig{"default": nil},
					},
				},
				Networks: types.Networks{"default": {Name: "create-project-test_default"}},
				ComposeFiles: []string{
					dir + "/docker-compose.yml",
				},
				Environment:      map[string]string{"COMPOSE_PROJECT_NAME": "create-project-test", "PORTAINER_VAR": "env"},
				DisabledServices: types.Services{},
				Profiles:         []string{""},
			},
		},
		{
			name: "Env Vars in compose env file, env, os, and env_file",
			filesToCreate: map[string]string{
				"docker-compose.yml": `services:
  nginx:
    container_name: nginx
    image: nginx:latest
    env_file: ` + dir + `/compose-stack.env`,
				"stack.env":         "PORTAINER_VAR=env_file",
				"compose-stack.env": "PORTAINER_VAR=compose_env_file",
			},
			configFilepaths: []string{dir + "/docker-compose.yml"},
			options: libstack.Options{
				ProjectName: projectName,
				Env:         []string{"PORTAINER_VAR=env"},
				EnvFilePath: dir + "/stack.env",
			},
			osEnv: map[string]string{
				"PORTAINER_VAR": "os",
			},
			expectedProject: &types.Project{
				Name:       projectName,
				WorkingDir: dir,
				Services: types.Services{
					"nginx": {
						Name:          "nginx",
						ContainerName: "nginx",
						Environment:   types.NewMappingWithEquals([]string{"PORTAINER_VAR=compose_env_file"}),
						Image:         "nginx:latest",
						Networks:      map[string]*types.ServiceNetworkConfig{"default": nil},
					},
				},
				Networks: types.Networks{"default": {Name: "create-project-test_default"}},
				ComposeFiles: []string{
					dir + "/docker-compose.yml",
				},
				Environment:      map[string]string{"COMPOSE_PROJECT_NAME": "create-project-test", "PORTAINER_VAR": "env"},
				DisabledServices: types.Services{},
				Profiles:         []string{""},
			},
		},
		{
			name: "Env Vars in env, os, and env_file",
			filesToCreate: map[string]string{
				"docker-compose.yml": `services:
  nginx:
    container_name: nginx
    image: nginx:latest`,
				"stack.env": "PORTAINER_VAR=env_file",
			},
			configFilepaths: []string{dir + "/docker-compose.yml"},
			options: libstack.Options{
				ProjectName: projectName,
				Env:         []string{"PORTAINER_VAR=env"},
				EnvFilePath: dir + "/stack.env",
			},
			osEnv: map[string]string{
				"PORTAINER_VAR": "os",
			},
			expectedProject: &types.Project{
				Name:       projectName,
				WorkingDir: dir,
				Services: types.Services{
					"nginx": {
						Name:          "nginx",
						ContainerName: "nginx",
						Environment:   types.MappingWithEquals{},
						Image:         "nginx:latest",
						Networks:      map[string]*types.ServiceNetworkConfig{"default": nil},
					},
				},
				Networks: types.Networks{"default": {Name: "create-project-test_default"}},
				ComposeFiles: []string{
					dir + "/docker-compose.yml",
				},
				Environment:      map[string]string{"COMPOSE_PROJECT_NAME": "create-project-test", "PORTAINER_VAR": "env"},
				DisabledServices: types.Services{},
				Profiles:         []string{""},
			},
		},
		{
			name: "Env Vars in os and env_file",
			filesToCreate: map[string]string{
				"docker-compose.yml": `services:
  nginx:
    container_name: nginx
    image: nginx:latest`,
				"stack.env": "PORTAINER_VAR=env_file",
			},
			configFilepaths: []string{dir + "/docker-compose.yml"},
			options: libstack.Options{
				ProjectName: projectName,
				EnvFilePath: dir + "/stack.env",
			},
			osEnv: map[string]string{
				"PORTAINER_VAR": "os",
			},
			expectedProject: &types.Project{
				Name:       projectName,
				WorkingDir: dir,
				Services: types.Services{
					"nginx": {
						Name:          "nginx",
						ContainerName: "nginx",
						Environment:   types.MappingWithEquals{},
						Image:         "nginx:latest",
						Networks:      map[string]*types.ServiceNetworkConfig{"default": nil},
					},
				},
				Networks: types.Networks{"default": {Name: "create-project-test_default"}},
				ComposeFiles: []string{
					dir + "/docker-compose.yml",
				},
				Environment:      map[string]string{"COMPOSE_PROJECT_NAME": "create-project-test", "PORTAINER_VAR": "os"},
				DisabledServices: types.Services{},
				Profiles:         []string{""},
			},
		},
		{
			name: "Env Vars in env_file",
			filesToCreate: map[string]string{
				"docker-compose.yml": `services:
  nginx:
    container_name: nginx
    image: nginx:latest`,
				"stack.env": "PORTAINER_VAR=env_file",
			},
			configFilepaths: []string{dir + "/docker-compose.yml"},
			options: libstack.Options{
				ProjectName: projectName,
				EnvFilePath: dir + "/stack.env",
			},
			expectedProject: &types.Project{
				Name:       projectName,
				WorkingDir: dir,
				Services: types.Services{
					"nginx": {
						Name:          "nginx",
						ContainerName: "nginx",
						Environment:   types.MappingWithEquals{},
						Image:         "nginx:latest",
						Networks:      map[string]*types.ServiceNetworkConfig{"default": nil},
					},
				},
				Networks: types.Networks{"default": {Name: "create-project-test_default"}},
				ComposeFiles: []string{
					dir + "/docker-compose.yml",
				},
				Environment:      map[string]string{"COMPOSE_PROJECT_NAME": "create-project-test", "PORTAINER_VAR": "env_file"},
				DisabledServices: types.Services{},
				Profiles:         []string{""},
			},
		},
	}

	for _, tc := range testcases {
		t.Run(tc.name, func(t *testing.T) {
			createdFiles := make([]string, 0, len(tc.filesToCreate))
			for f, fc := range tc.filesToCreate {
				createdFiles = append(createdFiles, createFile(t, dir, f, fc))
			}

			defer func() {
				var errs error
				for _, f := range createdFiles {
					errs = errors.Join(errs, os.Remove(f))
				}

				if errs != nil {
					t.Fatalf("Failed to remove config files: %v", errs)
				}
			}()

			for k, v := range tc.osEnv {
				t.Setenv(k, v)
			}

			gotProject, err := createProject(ctx, tc.configFilepaths, tc.options)
			if err != nil {
				t.Fatalf("Failed to create new project: %v", err)
			}

			if diff := cmp.Diff(gotProject, tc.expectedProject); diff != "" {
				t.Fatalf("Projects are different:\n%s", diff)
			}
		})
	}
}

func Test_CredentialsStore_Behavior(t *testing.T) {
	ctx := context.Background()
	// Create a temporary Docker config with a credsStore set (simulating Docker Desktop)
	tmpDir := t.TempDir()

	// Write a fake config.json with credsStore configured
	configJSON := `{
	"credsStore": "test-store",
	"auths": {}
}`
	configPath := filepath.Join(tmpDir, "config.json")
	err := os.WriteFile(configPath, []byte(configJSON), 0644)
	require.NoError(t, err)

	t.Run("withCli preserves credsStore when no registries provided", func(t *testing.T) {
		// Set the Docker config directory to the temp dir
		config.SetDir(tmpDir)

		var capturedCredsStore string
		var capturedAuthConfigs map[string]configtypes.AuthConfig

		err = withCli(ctx, libstack.Options{}, func(ctx context.Context, cli *command.DockerCli) error {
			// Capture the state after withCli sets up credentials
			capturedCredsStore = cli.ConfigFile().CredentialsStore
			capturedAuthConfigs = cli.ConfigFile().AuthConfigs
			return nil
		})
		require.NoError(t, err)

		// Verify the fix: credsStore should be preserved when no registries are provided
		require.Equal(t, "test-store", capturedCredsStore,
			"credsStore should be preserved when no registries are provided")

		// Verify registry credentials were not set
		require.Empty(t, capturedAuthConfigs,
			"no registry credentials should be configured in AuthConfigs")
	})

	t.Run("withCli clears credsStore when registries provided", func(t *testing.T) {
		// Set the Docker config directory to the temp dir
		config.SetDir(tmpDir)

		// Test with registries provided
		registries := []configtypes.AuthConfig{
			{
				Username:      "testuser",
				Password:      "testpass",
				ServerAddress: "registry.example.com",
			},
		}
		var capturedCredsStore string
		var capturedAuthConfigs map[string]configtypes.AuthConfig

		err = withCli(ctx, libstack.Options{Registries: registries}, func(ctx context.Context, cli *command.DockerCli) error {
			// Capture the state after withCli sets up credentials
			capturedCredsStore = cli.ConfigFile().CredentialsStore
			capturedAuthConfigs = cli.ConfigFile().AuthConfigs
			return nil
		})
		require.NoError(t, err)

		// Verify the fix: credsStore should be empty when registries are provided
		require.Empty(t, capturedCredsStore,
			"credsStore should be cleared when registries are provided to force Docker to use inline credentials")

		// Verify registry credentials were set
		require.Contains(t, capturedAuthConfigs, "registry.example.com",
			"custom registry credentials should be configured in AuthConfigs")
		require.Equal(t, "testuser", capturedAuthConfigs["registry.example.com"].Username,
			"custom registry username should match")
	})
}

func createMockComposeService(command.Cli, ...compose.Option) api.Compose {
	return &mockComposeService{}
}

type mockComposeService struct {
	api.Compose
	maxConcurrency int
}

func (s *mockComposeService) MaxConcurrency(parallel int) {
	s.maxConcurrency = parallel
}
