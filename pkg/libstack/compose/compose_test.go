package compose_test

import (
	"log"
	"os"
	"os/exec"
	"strings"
	"testing"

	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/pkg/libstack"
	"github.com/portainer/portainer/pkg/libstack/compose"
	"github.com/portainer/portainer/pkg/testhelpers"
)

func checkPrerequisites(t *testing.T) {
	testhelpers.IntegrationTest(t)
}

func Test_UpAndDown(t *testing.T) {
	t.Parallel()
	checkPrerequisites(t)

	deployer := compose.NewComposeDeployer()

	const composeFileContent = `
    version: "3.9"
    services:
      busybox:
        image: "alpine:3.7"
        container_name: "binarytest_container_one"
    `

	const overrideComposeFileContent = `
    version: "3.9"
    services:
      busybox:
        image: "alpine:latest"
        container_name: "binarytest_container_two"
    `

	const composeContainerName = "binarytest_container_two"

	dir := t.TempDir()

	filePathOriginal, err := createFile(dir, "docker-compose.yml", composeFileContent)
	if err != nil {
		t.Fatal(err)
	}

	filePathOverride, err := createFile(dir, "docker-compose-override.yml", overrideComposeFileContent)
	if err != nil {
		t.Fatal(err)
	}

	projectName := "binarytest"

	err = deployer.Deploy(t.Context(), []string{filePathOriginal, filePathOverride}, libstack.DeployOptions{
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

	err = deployer.Remove(t.Context(), projectName, []string{filePathOriginal, filePathOverride}, libstack.RemoveOptions{})
	if err != nil {
		t.Fatal(err)
	}

	if containerExists(composeContainerName) {
		t.Fatal("container should be removed")
	}
}

func createFile(dir, fileName, content string) (string, error) {
	filePath := filesystem.JoinPaths(dir, fileName)

	if err := os.WriteFile(filePath, []byte(content), 0644); err != nil {
		return "", err
	}

	return filePath, nil
}

func containerExists(containerName string) bool {
	cmd := exec.Command("docker", "ps", "-a", "-f", "name="+containerName)

	out, err := cmd.Output()
	if err != nil {
		log.Fatalf("failed to list containers: %s", err)
	}

	return strings.Contains(string(out), containerName)
}
