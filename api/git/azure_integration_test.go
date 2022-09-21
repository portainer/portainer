package git

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"testing"
	"time"

	_ "github.com/joho/godotenv/autoload"
	"github.com/stretchr/testify/assert"
)

var (
	privateAzureRepoURL = "https://portainer.visualstudio.com/gitops-test/_git/gitops-test"
)

func TestService_ClonePublicRepository_Azure(t *testing.T) {
	ensureIntegrationTest(t)

	pat := getRequiredValue(t, "AZURE_DEVOPS_PAT")
	service := NewService(context.TODO())

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
			dst := t.TempDir()
			repositoryUrl := fmt.Sprintf(tt.args.repositoryURLFormat, tt.args.password)
			err := service.CloneRepository(dst, repositoryUrl, tt.args.referenceName, "", "")
			assert.NoError(t, err)
			assert.FileExists(t, filepath.Join(dst, "README.md"))
		})
	}
}

func TestService_ClonePrivateRepository_Azure(t *testing.T) {
	ensureIntegrationTest(t)

	pat := getRequiredValue(t, "AZURE_DEVOPS_PAT")
	service := NewService(context.TODO())

	dst := t.TempDir()

	err := service.CloneRepository(dst, privateAzureRepoURL, "refs/heads/main", "", pat)
	assert.NoError(t, err)
	assert.FileExists(t, filepath.Join(dst, "README.md"))
}

func TestService_LatestCommitID_Azure(t *testing.T) {
	ensureIntegrationTest(t)

	pat := getRequiredValue(t, "AZURE_DEVOPS_PAT")
	service := NewService(context.TODO())

	id, err := service.LatestCommitID(privateAzureRepoURL, "refs/heads/main", "", pat)
	assert.NoError(t, err)
	assert.NotEmpty(t, id, "cannot guarantee commit id, but it should be not empty")
}

func TestService_ListRefs_Azure(t *testing.T) {
	ensureIntegrationTest(t)

	accessToken := getRequiredValue(t, "AZURE_DEVOPS_PAT")
	username := getRequiredValue(t, "AZURE_DEVOPS_USERNAME")
	service := NewService(context.TODO())

	refs, err := service.ListRefs(privateAzureRepoURL, username, accessToken, false)
	assert.NoError(t, err)
	assert.GreaterOrEqual(t, len(refs), 1)
}

func TestService_ListRefs_Azure_Concurrently(t *testing.T) {
	ensureIntegrationTest(t)

	accessToken := getRequiredValue(t, "AZURE_DEVOPS_PAT")
	username := getRequiredValue(t, "AZURE_DEVOPS_USERNAME")
	service := newService(context.TODO(), REPOSITORY_CACHE_SIZE, 200*time.Millisecond)

	go service.ListRefs(privateAzureRepoURL, username, accessToken, false)
	service.ListRefs(privateAzureRepoURL, username, accessToken, false)

	time.Sleep(2 * time.Second)
}

func TestService_ListFiles_Azure(t *testing.T) {
	ensureIntegrationTest(t)

	type expectResult struct {
		shouldFail   bool
		err          error
		matchedCount int
	}
	service := newService(context.TODO(), 0, 0)
	accessToken := getRequiredValue(t, "AZURE_DEVOPS_PAT")
	username := getRequiredValue(t, "AZURE_DEVOPS_USERNAME")

	tests := []struct {
		name       string
		args       fetchOption
		extensions []string
		expect     expectResult
	}{
		{
			name: "list tree with real repository and head ref but incorrect credential",
			args: fetchOption{
				baseOption: baseOption{
					repositoryUrl: privateAzureRepoURL,
					username:      "test-username",
					password:      "test-token",
				},
				referenceName: "refs/heads/main",
			},
			extensions: []string{},
			expect: expectResult{
				shouldFail: true,
				err:        ErrAuthenticationFailure,
			},
		},
		{
			name: "list tree with real repository and head ref but no credential",
			args: fetchOption{
				baseOption: baseOption{
					repositoryUrl: privateAzureRepoURL,
					username:      "",
					password:      "",
				},
				referenceName: "refs/heads/main",
			},
			extensions: []string{},
			expect: expectResult{
				shouldFail: true,
				err:        ErrAuthenticationFailure,
			},
		},
		{
			name: "list tree with real repository and head ref",
			args: fetchOption{
				baseOption: baseOption{
					repositoryUrl: privateAzureRepoURL,
					username:      username,
					password:      accessToken,
				},
				referenceName: "refs/heads/main",
			},
			extensions: []string{},
			expect: expectResult{
				err:          nil,
				matchedCount: 19,
			},
		},
		{
			name: "list tree with real repository and head ref and existing file extension",
			args: fetchOption{
				baseOption: baseOption{
					repositoryUrl: privateAzureRepoURL,
					username:      username,
					password:      accessToken,
				},
				referenceName: "refs/heads/main",
			},
			extensions: []string{"yml"},
			expect: expectResult{
				err:          nil,
				matchedCount: 2,
			},
		},
		{
			name: "list tree with real repository and head ref and non-existing file extension",
			args: fetchOption{
				baseOption: baseOption{
					repositoryUrl: privateAzureRepoURL,
					username:      username,
					password:      accessToken,
				},
				referenceName: "refs/heads/main",
			},
			extensions: []string{"hcl"},
			expect: expectResult{
				err:          nil,
				matchedCount: 2,
			},
		},
		{
			name: "list tree with real repository but non-existing ref",
			args: fetchOption{
				baseOption: baseOption{
					repositoryUrl: privateAzureRepoURL,
					username:      username,
					password:      accessToken,
				},
				referenceName: "refs/fake/feature",
			},
			extensions: []string{},
			expect: expectResult{
				shouldFail: true,
			},
		},
		{
			name: "list tree with fake repository ",
			args: fetchOption{
				baseOption: baseOption{
					repositoryUrl: privateAzureRepoURL + "fake",
					username:      username,
					password:      accessToken,
				},
				referenceName: "refs/fake/feature",
			},
			extensions: []string{},
			expect: expectResult{
				shouldFail: true,
				err:        ErrIncorrectRepositoryURL,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			paths, err := service.ListFiles(tt.args.repositoryUrl, tt.args.referenceName, tt.args.username, tt.args.password, false, tt.extensions)
			if tt.expect.shouldFail {
				assert.Error(t, err)
				if tt.expect.err != nil {
					assert.Equal(t, tt.expect.err, err)
				}
			} else {
				assert.NoError(t, err)
				if tt.expect.matchedCount > 0 {
					assert.Greater(t, len(paths), 0)
				}
			}
		})
	}
}

func TestService_ListFiles_Azure_Concurrently(t *testing.T) {
	ensureIntegrationTest(t)

	accessToken := getRequiredValue(t, "AZURE_DEVOPS_PAT")
	username := getRequiredValue(t, "AZURE_DEVOPS_USERNAME")
	service := newService(context.TODO(), REPOSITORY_CACHE_SIZE, 200*time.Millisecond)

	go service.ListFiles(privateAzureRepoURL, "refs/heads/main", username, accessToken, false, []string{})
	service.ListFiles(privateAzureRepoURL, "refs/heads/main", username, accessToken, false, []string{})

	time.Sleep(2 * time.Second)
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
