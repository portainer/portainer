package composeplugin

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"reflect"
	"strings"
	"testing"

	"github.com/portainer/portainer/pkg/libstack"
)

func checkPrerequisites(t *testing.T) {
	// if _, err := os.Stat("docker-compose"); errors.Is(err, os.ErrNotExist) {
	// 	t.Fatal("docker-compose binary not found, please run download.sh and re-run this test suite")
	// }
}

func setup(t *testing.T) libstack.Deployer {
	w, err := NewPluginWrapper("", "")
	if err != nil {
		t.Fatal(err)
	}

	return w
}

func Test_NewCommand_SingleFilePath(t *testing.T) {
	checkPrerequisites(t)

	cmd := newCommand([]string{"up", "-d"}, []string{"docker-compose.yml"})
	expected := []string{"-f", "docker-compose.yml"}
	if !reflect.DeepEqual(cmd.globalArgs, expected) {
		t.Errorf("wrong output args, want: %v, got: %v", expected, cmd.globalArgs)
	}
}

func Test_NewCommand_MultiFilePaths(t *testing.T) {
	checkPrerequisites(t)

	cmd := newCommand([]string{"up", "-d"}, []string{"docker-compose.yml", "docker-compose-override.yml"})
	expected := []string{"-f", "docker-compose.yml", "-f", "docker-compose-override.yml"}
	if !reflect.DeepEqual(cmd.globalArgs, expected) {
		t.Errorf("wrong output args, want: %v, got: %v", expected, cmd.globalArgs)
	}
}

func Test_NewCommand_MultiFilePaths_WithSpaces(t *testing.T) {
	checkPrerequisites(t)

	cmd := newCommand([]string{"up", "-d"}, []string{" docker-compose.yml", "docker-compose-override.yml "})
	expected := []string{"-f", "docker-compose.yml", "-f", "docker-compose-override.yml"}
	if !reflect.DeepEqual(cmd.globalArgs, expected) {
		t.Errorf("wrong output args, want: %v, got: %v", expected, cmd.globalArgs)
	}
}

func Test_UpAndDown(t *testing.T) {
	checkPrerequisites(t)

	const composeFileContent = `version: "3.9"
services:
  busybox:
    image: "alpine:3.7"
    container_name: "plugintest_container_one"`

	const overrideComposeFileContent = `version: "3.9"
services:
  busybox:
    image: "alpine:latest"
    container_name: "plugintest_container_two"`

	const composeContainerName = "plugintest_container_two"

	w := setup(t)

	dir := t.TempDir()

	filePathOriginal, err := createFile(dir, "docker-compose.yml", composeFileContent)
	if err != nil {
		t.Fatal(err)
	}

	filePathOverride, err := createFile(dir, "docker-compose-override.yml", overrideComposeFileContent)
	if err != nil {
		t.Fatal(err)
	}

	projectName := "plugintest"

	ctx := context.Background()
	err = w.Deploy(ctx, []string{filePathOriginal, filePathOverride}, libstack.DeployOptions{
		Options: libstack.Options{
			ProjectName: projectName,
		},
	})
	if err != nil {
		t.Fatal(err)
	}

	if !containerExists(composeContainerName) {
		t.Fatal("container should exist")
	}

	err = w.Remove(ctx, projectName, []string{filePathOriginal, filePathOverride}, libstack.Options{})
	if err != nil {
		t.Fatal(err)
	}

	if containerExists(composeContainerName) {
		t.Fatal("container should be removed")
	}
}

func createFile(dir, fileName, content string) (string, error) {
	filePath := filepath.Join(dir, fileName)
	f, err := os.Create(filePath)
	if err != nil {
		return "", err
	}

	_, err = f.WriteString(content)
	if err != nil {
		return "", err
	}

	f.Close()

	return filePath, nil
}

func containerExists(containerName string) bool {
	cmd := exec.Command("docker", "ps", "-a", "-f", fmt.Sprintf("name=%s", containerName))

	out, err := cmd.Output()
	if err != nil {
		log.Fatalf("failed to list containers: %s", err)
	}

	return strings.Contains(string(out), containerName)
}

func Test_Config(t *testing.T) {
	checkPrerequisites(t)

	ctx := context.Background()
	dir := t.TempDir()
	projectName := "configtest"

	defer os.RemoveAll(dir)

	testCases := []struct {
		name               string
		composeFileContent string
		expectFileContent  string
		envFileContent     string
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
			envFileContent: "",
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
			envFileContent: "",
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
			envFileContent: "",
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
networks:
  default:
    name: configtest_default
`,
			envFileContent: `WEB_HOME=./html`,
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
			composeFilePath, err := createFile(dir, "docker-compose.yml", tc.composeFileContent)
			if err != nil {
				t.Fatal(err)
			}

			envFilePath := ""
			if tc.envFileContent != "" {
				envFilePath, err = createFile(dir, "stack.env", tc.envFileContent)
				if err != nil {
					t.Fatal(err)
				}
			}

			w := setup(t)
			actual, err := w.Config(ctx, []string{composeFilePath}, libstack.Options{
				WorkingDir:    dir,
				ProjectName:   projectName,
				EnvFilePath:   envFilePath,
				ConfigOptions: []string{"--no-path-resolution"},
			})
			if err != nil {
				t.Fatalf("failed to get config: %s. Error: %s", string(actual), err)
			}

			if string(actual) != tc.expectFileContent {
				t.Fatalf("unexpected config output: %s(len=%d), expect: %s(len=%d)", actual, len(actual), tc.expectFileContent, len(tc.expectFileContent))
			}
		})
	}
}
