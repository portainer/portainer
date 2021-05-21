package stacks

import (
	"os"
	"strings"
	"testing"

	"github.com/portainer/portainer/api/git"
)

func TestCloneAndConvertGitRepoFile(t *testing.T) {
	h := &Handler{
		GitService: git.NewService(),
	}
	tmpGitDir := "./tmp"
	defer os.RemoveAll(tmpGitDir)
	gitInfo := &kubernetesGitDeploymentPayload{
		ComposeFormat:            false,
		Namespace:                "default",
		RepositoryURL:            "https://github.com/ArrisLee/dummies",
		RepositoryReferenceName:  "refs/heads/master",
		RepositoryAuthentication: false,
		FilePathInRepository:     "nginx.yml",
	}
	fileContent, err := h.cloneAndConvertGitRepoFile(gitInfo, tmpGitDir)
	if err != nil {
		t.Errorf("failed to clone or convert the file from Git repo, err: %v", err)
	}
	if !strings.HasPrefix(fileContent, "apiVersion") {
		t.Error("wrong manifest file content")
	}
}
