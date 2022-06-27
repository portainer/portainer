package git

import (
	"fmt"
	"os"
	"path/filepath"
	"testing"

	"github.com/docker/docker/pkg/ioutils"
	_ "github.com/joho/godotenv/autoload"
	"github.com/stretchr/testify/assert"
)

var (
	privateAzureRepoURL = "https://portainer.visualstudio.com/gitops-test/_git/gitops-test"
)

func TestService_ClonePublicRepository_Azure(t *testing.T) {
	ensureIntegrationTest(t)

	pat := getRequiredValue(t, "AZURE_DEVOPS_PAT")
	service := NewService()

	type args struct {
		repositoryURLFormat string
		referenceName       string
		username            string
		password            string
	}
	tests := []struct {
		name    string
		args    args
		wantErr bool
	}{
		{
			name: "Clone Azure DevOps repo branch",
			args: args{
				repositoryURLFormat: "https://:%s@portainer.visualstudio.com/gitops-test/_git/gitops-test",
				referenceName:       "refs/heads/main",
				username:            "",
				password:            pat,
			},
			wantErr: false,
		},
		{
			name: "Clone Azure DevOps repo tag",
			args: args{
				repositoryURLFormat: "https://:%s@portainer.visualstudio.com/gitops-test/_git/gitops-test",
				referenceName:       "refs/heads/tags/v1.1",
				username:            "",
				password:            pat,
			},
			wantErr: false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			dst, err := ioutils.TempDir("", "clone")
			assert.NoError(t, err)
			defer os.RemoveAll(dst)
			repositoryUrl := fmt.Sprintf(tt.args.repositoryURLFormat, tt.args.password)
			err = service.CloneRepository(dst, repositoryUrl, tt.args.referenceName, "", "")
			assert.NoError(t, err)
			assert.FileExists(t, filepath.Join(dst, "README.md"))
		})
	}
}

func TestService_ClonePrivateRepository_Azure(t *testing.T) {
	ensureIntegrationTest(t)

	pat := getRequiredValue(t, "AZURE_DEVOPS_PAT")
	service := NewService()

	dst, err := ioutils.TempDir("", "clone")
	assert.NoError(t, err)
	defer os.RemoveAll(dst)

	err = service.CloneRepository(dst, privateAzureRepoURL, "refs/heads/main", "", pat)
	assert.NoError(t, err)
	assert.FileExists(t, filepath.Join(dst, "README.md"))
}

func TestService_LatestCommitID_Azure(t *testing.T) {
	ensureIntegrationTest(t)

	pat := getRequiredValue(t, "AZURE_DEVOPS_PAT")
	service := NewService()

	id, err := service.LatestCommitID(privateAzureRepoURL, "refs/heads/main", "", pat)
	assert.NoError(t, err)
	assert.NotEmpty(t, id, "cannot guarantee commit id, but it should be not empty")
}

func TestService_ListRemote_Azure(t *testing.T) {
	ensureIntegrationTest(t)

	accessToken := getRequiredValue(t, "AZURE_DEVOPS_PAT")
	username := getRequiredValue(t, "AZURE_DEVOPS_USERNAME")
	service := NewService()

	refs, err := service.ListRemote(privateAzureRepoURL, username, accessToken)
	assert.NoError(t, err)
	assert.GreaterOrEqual(t, len(refs), 1)
}

func TestService_ListTree_Azure(t *testing.T) {
	ensureIntegrationTest(t)

	accessToken := getRequiredValue(t, "AZURE_DEVOPS_PAT")
	username := getRequiredValue(t, "AZURE_DEVOPS_USERNAME")
	service := NewService()

	paths, err := service.ListTree(privateAzureRepoURL, "refs/heads/main", username, accessToken, []string{})
	assert.NoError(t, err)
	assert.GreaterOrEqual(t, len(paths), 1)
}

func getRequiredValue(t *testing.T, name string) string {
	value, ok := os.LookupEnv(name)
	if !ok {
		t.Fatalf("can't find required env var \"%s\"", name)
	}
	return value
}

func ensureIntegrationTest(t *testing.T) {
	if _, ok := os.LookupEnv("INTEGRATION_TEST"); !ok {
		t.Skip("skip an integration test")
	}
}
