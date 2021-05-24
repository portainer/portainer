package stacks

import (
	"os"
	"strings"
	"testing"

	"github.com/portainer/portainer/api/git"
)

const (
	publicRepoURL = "https://github.com/portainer/test-public-repo"
	publicRepoRef = "refs/heads/master"
)

//init a test handler with git service
//init a temp dir
func setup() (*Handler, string) {
	h := &Handler{
		GitService: git.NewService(),
	}
	return h, os.TempDir()
}

func Test_CloneAndConvertGitRepoFile_K8SManifest(t *testing.T) {
	h, tmpGitDir := setup()
	defer os.RemoveAll(tmpGitDir)
	gitInfo := &kubernetesGitDeploymentPayload{
		RepositoryURL:            publicRepoURL,
		RepositoryReferenceName:  publicRepoRef,
		RepositoryAuthentication: false,
		FilePathInRepository:     "nginx-deployment-demo.yaml",
	}
	t.Logf("Cloning to %s", tmpGitDir)
	fileContent, err := h.cloneAndConvertGitRepoFile(gitInfo, tmpGitDir)
	if err != nil {
		t.Fatalf("failed to clone or convert the file from Git repo, err: %v", err)
	}
	if !strings.HasPrefix(fileContent, "apiVersion") {
		t.Error("wrong manifest file content")
	}
}

func Test_CloneAndConvertGitRepoFile_Compose(t *testing.T) {
	h, tmpGitDir := setup()
	defer os.RemoveAll(tmpGitDir)
	gitInfo := &kubernetesGitDeploymentPayload{
		RepositoryURL:            publicRepoURL,
		RepositoryReferenceName:  publicRepoRef,
		RepositoryAuthentication: false,
		FilePathInRepository:     "kompose-demo.yaml",
	}
	t.Logf("Cloning to %s", tmpGitDir)
	fileContent, err := h.cloneAndConvertGitRepoFile(gitInfo, tmpGitDir)
	if err != nil {
		t.Fatalf("failed to clone or convert the file from Git repo, err: %v", err)
	}
	if !strings.HasPrefix(fileContent, "version") {
		t.Error("wrong docker compose file content")
	}
}
