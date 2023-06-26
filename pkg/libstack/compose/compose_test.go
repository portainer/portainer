package compose_test

import (
	"context"
	"errors"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"

	"github.com/portainer/portainer/pkg/libstack"
	"github.com/portainer/portainer/pkg/libstack/compose"
)

func checkPrerequisites(t *testing.T) {
	if _, err := os.Stat("docker-compose"); errors.Is(err, os.ErrNotExist) {
		t.Fatal("docker-compose binary not found, please run download.sh and re-run this suite")
	}
}

func Test_UpAndDown(t *testing.T) {
	checkPrerequisites(t)

	deployer, _ := compose.NewComposeDeployer("", "")

	const composeFileContent = `
    version: "3.9"
    services:
      busybox:
        image: "alpine:3.7"
        container_name: "test_container_one"
    `

	const overrideComposeFileContent = `
    version: "3.9"
    services:
      busybox:
        image: "alpine:latest"
        container_name: "test_container_two"
    `

	const composeContainerName = "test_container_two"

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

	err = deployer.Deploy(ctx, []string{filePathOriginal, filePathOverride}, libstack.DeployOptions{})
	if err != nil {
		t.Fatal(err)
	}

	if !containerExists(composeContainerName) {
		t.Fatal("container should exist")
	}

	err = deployer.Remove(ctx, "", []string{filePathOriginal, filePathOverride}, libstack.Options{})
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

	f.WriteString(content)
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
