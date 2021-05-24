package git

import (
	"github.com/docker/docker/pkg/ioutils"
	"github.com/stretchr/testify/assert"
	"os"
	"path/filepath"
	"testing"
)

func TestService_ClonePrivateRepository_GitHub(t *testing.T) {
	ensureIntegrationTest(t)

	pat := getRequiredValue(t, "GITHUB_PAT")
	username := getRequiredValue(t, "GITHUB_USERNAME")
	service := NewService()

	dst, err := ioutils.TempDir("", "clone")
	assert.NoError(t, err)
	defer os.RemoveAll(dst)

	repositoryUrl := "https://github.com/portainer/private-test-repository.git"
	err = service.ClonePrivateRepositoryWithBasicAuth(repositoryUrl, "refs/heads/main", dst, username, pat)
	assert.NoError(t, err)
	assert.FileExists(t, filepath.Join(dst, "README.md"))
}
