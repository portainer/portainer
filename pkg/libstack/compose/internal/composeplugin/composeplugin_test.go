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
    container_name: "test_container_one"`

	const overrideComposeFileContent = `version: "3.9"
services:
  busybox:
    image: "alpine:latest"
    container_name: "test_container_two"`

	const composeContainerName = "test_container_two"

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

	ctx := context.Background()
	err = w.Deploy(ctx, []string{filePathOriginal, filePathOverride}, libstack.DeployOptions{})
	if err != nil {
		t.Fatal(err)
	}

	if !containerExists(composeContainerName) {
		t.Fatal("container should exist")
	}

	err = w.Remove(ctx, "", []string{filePathOriginal, filePathOverride}, libstack.Options{})
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
