package stacks

import (
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/portainer/portainer/api/archive"
	"github.com/portainer/portainer/api/git"
)

func TestCloneAndConvertGitRepoFile(t *testing.T) {
	dir, err := ioutil.TempDir("", "git-repo-")
	if err != nil {
		t.Fatalf("failed to create a temp repo directory, err: %v", err)
	}
	defer os.RemoveAll(dir)

	file, err := os.OpenFile("./testdata/test-clone-git-repo.tar.gz", os.O_RDONLY, 0755)
	if err != nil {
		t.Fatalf("failed to open an archive, err: %v", err)
	}
	err = archive.ExtractTarGz(file, dir)
	if err != nil {
		t.Fatalf("failed to extract file from the archive to a folder: err %v", err)
	}

	bareGITRepoDir := filepath.Join(dir, "test-clone.git")
	tmpGITDir := os.TempDir()
	defer os.RemoveAll(tmpGITDir)

	h := &Handler{
		GitService: git.NewService(),
	}
	gitInfo := &kubernetesGitDeploymentPayload{
		RepositoryURL:            bareGITRepoDir,
		RepositoryReferenceName:  "refs/heads/main",
		RepositoryAuthentication: false,
		FilePathInRepository:     "nginx-deployment.yml",
	}
	fileContent, err := h.cloneAndConvertGitRepoFile(gitInfo, tmpGITDir)
	if err != nil {
		t.Fatalf("failed to clone or convert the file from Git repo, err: %v", err)
	}
	if !strings.HasPrefix(fileContent, "apiVersion") {
		t.Error("wrong k8s manifest file content")
	}
}
