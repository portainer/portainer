package git

import (
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/portainer/portainer/api/filesystem"
	gittypes "github.com/portainer/portainer/api/git/types"

	_ "github.com/joho/godotenv/autoload"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const privateAzureRepoURL = "https://portainer.visualstudio.com/gitops-test/_git/gitops-test"

func TestService_ClonePublicRepository_Azure(t *testing.T) {
	t.Parallel()
	ensureIntegrationTest(t)

	pat := getRequiredValue(t, "AZURE_DEVOPS_PAT")
	service := NewService(t.Context())

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
			err := service.CloneRepository(
				t.Context(),
				dst,
				repositoryUrl,
				tt.args.referenceName,
				"",
				"",
				false,
			)
			require.NoError(t, err)
			assert.FileExists(t, filesystem.JoinPaths(dst, "README.md"))
		})
	}
}

func TestService_ClonePrivateRepository_Azure(t *testing.T) {
	t.Parallel()
	ensureIntegrationTest(t)

	pat := getRequiredValue(t, "AZURE_DEVOPS_PAT")
	service := NewService(t.Context())

	dst := t.TempDir()

	err := service.CloneRepository(
		t.Context(),
		dst,
		privateAzureRepoURL,
		"refs/heads/main",
		"",
		pat,
		false,
	)
	require.NoError(t, err)
	assert.FileExists(t, filesystem.JoinPaths(dst, "README.md"))
}

func TestService_LatestCommitID_Azure(t *testing.T) {
	t.Parallel()
	ensureIntegrationTest(t)

	pat := getRequiredValue(t, "AZURE_DEVOPS_PAT")
	service := NewService(t.Context())

	id, err := service.LatestCommitID(
		t.Context(),
		privateAzureRepoURL,
		"refs/heads/main",
		"",
		pat,
		false,
	)
	require.NoError(t, err)
	assert.NotEmpty(t, id, "cannot guarantee commit id, but it should be not empty")
}

func TestService_ListRefs_Azure(t *testing.T) {
	t.Parallel()
	ensureIntegrationTest(t)

	accessToken := getRequiredValue(t, "AZURE_DEVOPS_PAT")
	username := getRequiredValue(t, "AZURE_DEVOPS_USERNAME")
	service := NewService(t.Context())

	refs, err := service.ListRefs(
		t.Context(),
		privateAzureRepoURL,
		username,
		accessToken,
		false,
		false,
	)
	require.NoError(t, err)
	assert.GreaterOrEqual(t, len(refs), 1)
}

func TestService_ListRefs_Azure_Concurrently(t *testing.T) {
	t.Parallel()
	ensureIntegrationTest(t)

	accessToken := getRequiredValue(t, "AZURE_DEVOPS_PAT")
	username := getRequiredValue(t, "AZURE_DEVOPS_USERNAME")
	service := newService(t.Context(), repositoryCacheSize, 200*time.Millisecond)

	go func() {
		_, _ = service.ListRefs(t.Context(), privateAzureRepoURL, username, accessToken, false, false)
	}()

	_, err := service.ListRefs(t.Context(), privateAzureRepoURL, username, accessToken, false, false)
	require.NoError(t, err)

	time.Sleep(2 * time.Second)
}

func TestService_ListFiles_Azure(t *testing.T) {
	t.Parallel()
	ensureIntegrationTest(t)

	type args struct {
		repositoryUrl string
		referenceName string
		username      string
		password      string
		extensions    []string
	}

	type expectResult struct {
		shouldFail   bool
		err          error
		matchedCount int
	}

	service := newService(t.Context(), 0, 0)
	accessToken := getRequiredValue(t, "AZURE_DEVOPS_PAT")
	username := getRequiredValue(t, "AZURE_DEVOPS_USERNAME")

	tests := []struct {
		name   string
		args   args
		expect expectResult
	}{
		{
			name: "list tree with real repository and head ref but incorrect credential",
			args: args{
				repositoryUrl: privateAzureRepoURL,
				referenceName: "refs/heads/main",
				username:      "test-username",
				password:      "test-token",
				extensions:    []string{},
			},
			expect: expectResult{
				shouldFail: true,
				err:        gittypes.ErrAuthenticationFailure,
			},
		},
		{
			name: "list tree with real repository and head ref but no credential",
			args: args{
				repositoryUrl: privateAzureRepoURL,
				referenceName: "refs/heads/main",
				username:      "",
				password:      "",
				extensions:    []string{},
			},
			expect: expectResult{
				shouldFail: true,
				err:        gittypes.ErrAuthenticationFailure,
			},
		},
		{
			name: "list tree with real repository and head ref",
			args: args{
				repositoryUrl: privateAzureRepoURL,
				referenceName: "refs/heads/main",
				username:      username,
				password:      accessToken,
				extensions:    []string{},
			},
			expect: expectResult{
				err:          nil,
				matchedCount: 19,
			},
		},
		{
			name: "list tree with real repository and head ref and existing file extension",
			args: args{
				repositoryUrl: privateAzureRepoURL,
				referenceName: "refs/heads/main",
				username:      username,
				password:      accessToken,
				extensions:    []string{"yml"},
			},
			expect: expectResult{
				err:          nil,
				matchedCount: 2,
			},
		},
		{
			name: "list tree with real repository and head ref and non-existing file extension",
			args: args{
				repositoryUrl: privateAzureRepoURL,
				referenceName: "refs/heads/main",
				username:      username,
				password:      accessToken,
				extensions:    []string{"hcl"},
			},
			expect: expectResult{
				err:          nil,
				matchedCount: 2,
			},
		},
		{
			name: "list tree with real repository but non-existing ref",
			args: args{
				repositoryUrl: privateAzureRepoURL,
				referenceName: "refs/fake/feature",
				username:      username,
				password:      accessToken,
				extensions:    []string{},
			},
			expect: expectResult{
				shouldFail: true,
			},
		},
		{
			name: "list tree with fake repository ",
			args: args{
				repositoryUrl: privateAzureRepoURL + "fake",
				referenceName: "refs/fake/feature",
				username:      username,
				password:      accessToken,
				extensions:    []string{},
			},
			expect: expectResult{
				shouldFail: true,
				err:        gittypes.ErrIncorrectRepositoryURL,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			paths, err := service.ListFiles(
				t.Context(),
				tt.args.repositoryUrl,
				tt.args.referenceName,
				tt.args.username,
				tt.args.password,
				false,
				false,
				tt.args.extensions,
				false,
			)

			if tt.expect.shouldFail {
				require.Error(t, err)
				if tt.expect.err != nil {
					assert.Equal(t, tt.expect.err, err)
				}
			} else {
				require.NoError(t, err)
				if tt.expect.matchedCount > 0 {
					assert.NotEmpty(t, paths)
				}
			}
		})
	}
}

func TestService_ListFiles_Azure_Concurrently(t *testing.T) {
	t.Parallel()
	ensureIntegrationTest(t)

	accessToken := getRequiredValue(t, "AZURE_DEVOPS_PAT")
	username := getRequiredValue(t, "AZURE_DEVOPS_USERNAME")
	service := newService(t.Context(), repositoryCacheSize, 200*time.Millisecond)

	go func() {
		_, _ = service.ListFiles(
			t.Context(),
			privateAzureRepoURL,
			"refs/heads/main",
			username,
			accessToken,
			false,
			false,
			[]string{},
			false,
		)
	}()

	_, err := service.ListFiles(
		t.Context(),
		privateAzureRepoURL,
		"refs/heads/main",
		username,
		accessToken,
		false,
		false,
		[]string{},
		false,
	)
	require.NoError(t, err)

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
