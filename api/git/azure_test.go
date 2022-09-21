package git

import (
	"context"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/stretchr/testify/assert"
)

func Test_buildDownloadUrl(t *testing.T) {
	a := NewAzureClient()
	u, err := a.buildDownloadUrl(&azureOptions{
		organisation: "organisation",
		project:      "project",
		repository:   "repository",
	}, "refs/heads/main")

	expectedUrl, _ := url.Parse("https://dev.azure.com/organisation/project/_apis/git/repositories/repository/items?scopePath=/&download=true&versionDescriptor.version=main&$format=zip&recursionLevel=full&api-version=6.0&versionDescriptor.versionType=branch")
	actualUrl, _ := url.Parse(u)
	if assert.NoError(t, err) {
		assert.Equal(t, expectedUrl.Host, actualUrl.Host)
		assert.Equal(t, expectedUrl.Scheme, actualUrl.Scheme)
		assert.Equal(t, expectedUrl.Path, actualUrl.Path)
		assert.Equal(t, expectedUrl.Query(), actualUrl.Query())
	}
}

func Test_buildRootItemUrl(t *testing.T) {
	a := NewAzureClient()
	u, err := a.buildRootItemUrl(&azureOptions{
		organisation: "organisation",
		project:      "project",
		repository:   "repository",
	}, "refs/heads/main")

	expectedUrl, _ := url.Parse("https://dev.azure.com/organisation/project/_apis/git/repositories/repository/items?scopePath=/&api-version=6.0&versionDescriptor.version=main&versionDescriptor.versionType=branch")
	actualUrl, _ := url.Parse(u)
	assert.NoError(t, err)
	assert.Equal(t, expectedUrl.Host, actualUrl.Host)
	assert.Equal(t, expectedUrl.Scheme, actualUrl.Scheme)
	assert.Equal(t, expectedUrl.Path, actualUrl.Path)
	assert.Equal(t, expectedUrl.Query(), actualUrl.Query())
}

func Test_buildRefsUrl(t *testing.T) {
	a := NewAzureClient()
	u, err := a.buildRefsUrl(&azureOptions{
		organisation: "organisation",
		project:      "project",
		repository:   "repository",
	})

	expectedUrl, _ := url.Parse("https://dev.azure.com/organisation/project/_apis/git/repositories/repository/refs?api-version=6.0")
	actualUrl, _ := url.Parse(u)
	assert.NoError(t, err)
	assert.Equal(t, expectedUrl.Host, actualUrl.Host)
	assert.Equal(t, expectedUrl.Scheme, actualUrl.Scheme)
	assert.Equal(t, expectedUrl.Path, actualUrl.Path)
	assert.Equal(t, expectedUrl.Query(), actualUrl.Query())
}

func Test_buildTreeUrl(t *testing.T) {
	a := NewAzureClient()
	u, err := a.buildTreeUrl(&azureOptions{
		organisation: "organisation",
		project:      "project",
		repository:   "repository",
	}, "sha1")

	expectedUrl, _ := url.Parse("https://dev.azure.com/organisation/project/_apis/git/repositories/repository/trees/sha1?api-version=6.0&recursive=true")
	actualUrl, _ := url.Parse(u)
	assert.NoError(t, err)
	assert.Equal(t, expectedUrl.Host, actualUrl.Host)
	assert.Equal(t, expectedUrl.Scheme, actualUrl.Scheme)
	assert.Equal(t, expectedUrl.Path, actualUrl.Path)
	assert.Equal(t, expectedUrl.Query(), actualUrl.Query())
}

func Test_parseAzureUrl(t *testing.T) {
	type args struct {
		url string
	}
	tests := []struct {
		name    string
		args    args
		want    *azureOptions
		wantErr bool
	}{
		{
			name: "Expected SSH URL format starting with ssh://",
			args: args{
				url: "ssh://git@ssh.dev.azure.com:v3/Organisation/Project/Repository",
			},
			want: &azureOptions{
				organisation: "Organisation",
				project:      "Project",
				repository:   "Repository",
			},
			wantErr: false,
		},
		{
			name: "Expected SSH URL format starting with git@ssh",
			args: args{
				url: "git@ssh.dev.azure.com:v3/Organisation/Project/Repository",
			},
			want: &azureOptions{
				organisation: "Organisation",
				project:      "Project",
				repository:   "Repository",
			},
			wantErr: false,
		},
		{
			name: "Unexpected SSH URL format",
			args: args{
				url: "git@ssh.dev.azure.com:v3/Organisation/Repository",
			},
			wantErr: true,
		},
		{
			name: "Expected HTTPS URL format",
			args: args{
				url: "https://Organisation@dev.azure.com/Organisation/Project/_git/Repository",
			},
			want: &azureOptions{
				organisation: "Organisation",
				project:      "Project",
				repository:   "Repository",
				username:     "Organisation",
			},
			wantErr: false,
		},
		{
			name: "HTTPS URL with credentials",
			args: args{
				url: "https://username:password@dev.azure.com/Organisation/Project/_git/Repository",
			},
			want: &azureOptions{
				organisation: "Organisation",
				project:      "Project",
				repository:   "Repository",
				username:     "username",
				password:     "password",
			},
			wantErr: false,
		},
		{
			name: "HTTPS URL with password",
			args: args{
				url: "https://:password@dev.azure.com/Organisation/Project/_git/Repository",
			},
			want: &azureOptions{
				organisation: "Organisation",
				project:      "Project",
				repository:   "Repository",
				password:     "password",
			},
			wantErr: false,
		},
		{
			name: "Visual Studio HTTPS URL with credentials",
			args: args{
				url: "https://username:password@organisation.visualstudio.com/project/_git/repository",
			},
			want: &azureOptions{
				organisation: "organisation",
				project:      "project",
				repository:   "repository",
				username:     "username",
				password:     "password",
			},
			wantErr: false,
		},
		{
			name: "Unexpected HTTPS URL format",
			args: args{
				url: "https://Organisation@dev.azure.com/Project/_git/Repository",
			},
			wantErr: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := parseUrl(tt.args.url)
			if (err != nil) != tt.wantErr {
				t.Errorf("parseUrl() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			assert.Equal(t, tt.want, got)
		})
	}
}

func Test_isAzureUrl(t *testing.T) {
	type args struct {
		s string
	}
	tests := []struct {
		name string
		args args
		want bool
	}{
		{
			name: "Is Azure url",
			args: args{
				s: "https://Organisation@dev.azure.com/Organisation/Project/_git/Repository",
			},
			want: true,
		},
		{
			name: "Is Azure url",
			args: args{
				s: "https://portainer.visualstudio.com/project/_git/repository",
			},
			want: true,
		},
		{
			name: "Is NOT Azure url",
			args: args{
				s: "https://github.com/Organisation/Repository",
			},
			want: false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.want, isAzureUrl(tt.args.s))
		})
	}
}

func Test_azureDownloader_downloadZipFromAzureDevOps(t *testing.T) {
	type args struct {
		options baseOption
	}
	type basicAuth struct {
		username, password string
	}
	tests := []struct {
		name string
		args args
		want *basicAuth
	}{
		{
			name: "username, password embedded",
			args: args{
				options: baseOption{
					repositoryUrl: "https://username:password@dev.azure.com/Organisation/Project/_git/Repository",
				},
			},
			want: &basicAuth{
				username: "username",
				password: "password",
			},
		},
		{
			name: "username, password embedded, clone options take precedence",
			args: args{
				options: baseOption{
					repositoryUrl: "https://username:password@dev.azure.com/Organisation/Project/_git/Repository",
					username:      "u",
					password:      "p",
				},
			},
			want: &basicAuth{
				username: "u",
				password: "p",
			},
		},
		{
			name: "no credentials",
			args: args{
				options: baseOption{
					repositoryUrl: "https://dev.azure.com/Organisation/Project/_git/Repository",
				},
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var zipRequestAuth *basicAuth
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if username, password, ok := r.BasicAuth(); ok {
					zipRequestAuth = &basicAuth{username, password}
				}
				w.WriteHeader(http.StatusNotFound) // this makes function under test to return an error
			}))
			defer server.Close()

			a := &azureClient{
				client:  server.Client(),
				baseUrl: server.URL,
			}

			option := cloneOption{
				fetchOption: fetchOption{
					baseOption: tt.args.options,
				},
			}
			_, err := a.downloadZipFromAzureDevOps(context.Background(), option)
			assert.Error(t, err)
			assert.Equal(t, tt.want, zipRequestAuth)
		})
	}
}

func Test_azureDownloader_latestCommitID(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		response := `{
		  "count": 1,
		  "value": [
			{
			  "objectId": "1a5630f017127db7de24d8771da0f536ff98fc9b",
			  "gitObjectType": "tree",
			  "commitId": "27104ad7549d9e66685e115a497533f18024be9c",
			  "path": "/",
			  "isFolder": true,
			  "url": "https://dev.azure.com/simonmeng0474/4b546a97-c481-4506-bdd5-976e9592f91a/_apis/git/repositories/a22247ad-053f-43bc-88a7-62ff4846bb97/items?path=%2F&versionType=Branch&versionOptions=None"
			}
		  ]
		}`
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(response))
	}))
	defer server.Close()

	a := &azureClient{
		client:  server.Client(),
		baseUrl: server.URL,
	}

	tests := []struct {
		name    string
		args    fetchOption
		want    string
		wantErr bool
	}{
		{
			name: "should be able to parse response",
			args: fetchOption{
				baseOption: baseOption{
					repositoryUrl: "https://dev.azure.com/Organisation/Project/_git/Repository",
				},
				referenceName: "",
			},
			want:    "27104ad7549d9e66685e115a497533f18024be9c",
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			id, err := a.latestCommitID(context.Background(), tt.args)
			if (err != nil) != tt.wantErr {
				t.Errorf("azureDownloader.latestCommitID() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			assert.Equal(t, tt.want, id)
		})
	}
}

type testRepoManager struct {
	called bool
}

func (t *testRepoManager) download(_ context.Context, _ string, _ cloneOption) error {
	t.called = true
	return nil
}

func (t *testRepoManager) latestCommitID(_ context.Context, _ fetchOption) (string, error) {
	return "", nil
}

func (t *testRepoManager) listRefs(_ context.Context, _ baseOption) ([]string, error) {
	return nil, nil
}

func (t *testRepoManager) listFiles(_ context.Context, _ fetchOption) ([]string, error) {
	return nil, nil
}
func Test_cloneRepository_azure(t *testing.T) {
	tests := []struct {
		name   string
		url    string
		called bool
	}{
		{
			name:   "Azure HTTP URL",
			url:    "https://Organisation@dev.azure.com/Organisation/Project/_git/Repository",
			called: true,
		},
		{
			name:   "Azure SSH URL",
			url:    "git@ssh.dev.azure.com:v3/Organisation/Project/Repository",
			called: true,
		},
		{
			name:   "Something else",
			url:    "https://example.com",
			called: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			azure := &testRepoManager{}
			git := &testRepoManager{}

			s := &Service{azure: azure, git: git}
			s.cloneRepository("", cloneOption{
				fetchOption: fetchOption{
					baseOption: baseOption{

						repositoryUrl: tt.url,
					},
				},
				depth: 1,
			})

			// if azure API is called, git isn't and vice versa
			assert.Equal(t, tt.called, azure.called)
			assert.Equal(t, tt.called, !git.called)
		})
	}
}

func Test_listRefs_azure(t *testing.T) {
	ensureIntegrationTest(t)

	client := NewAzureClient()

	type expectResult struct {
		err       error
		refsCount int
	}

	accessToken := getRequiredValue(t, "AZURE_DEVOPS_PAT")
	username := getRequiredValue(t, "AZURE_DEVOPS_USERNAME")
	tests := []struct {
		name   string
		args   baseOption
		expect expectResult
	}{
		{
			name: "list refs of a real repository",
			args: baseOption{
				repositoryUrl: privateAzureRepoURL,
				username:      username,
				password:      accessToken,
			},
			expect: expectResult{
				err:       nil,
				refsCount: 2,
			},
		},
		{
			name: "list refs of a real repository with incorrect credential",
			args: baseOption{
				repositoryUrl: privateAzureRepoURL,
				username:      "test-username",
				password:      "test-token",
			},
			expect: expectResult{
				err: ErrAuthenticationFailure,
			},
		},
		{
			name: "list refs of a real repository without providing credential",
			args: baseOption{
				repositoryUrl: privateAzureRepoURL,
				username:      "",
				password:      "",
			},
			expect: expectResult{
				err: ErrAuthenticationFailure,
			},
		},
		{
			name: "list refs of a fake repository",
			args: baseOption{
				repositoryUrl: privateAzureRepoURL + "fake",
				username:      username,
				password:      accessToken,
			},
			expect: expectResult{
				err: ErrIncorrectRepositoryURL,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			refs, err := client.listRefs(context.TODO(), tt.args)
			if tt.expect.err == nil {
				assert.NoError(t, err)
				if tt.expect.refsCount > 0 {
					assert.Greater(t, len(refs), 0)
				}
			} else {
				assert.Error(t, err)
				assert.Equal(t, tt.expect.err, err)
			}
		})
	}

}

func Test_listFiles_azure(t *testing.T) {
	ensureIntegrationTest(t)

	client := NewAzureClient()

	type expectResult struct {
		shouldFail   bool
		err          error
		matchedCount int
	}

	accessToken := getRequiredValue(t, "AZURE_DEVOPS_PAT")
	username := getRequiredValue(t, "AZURE_DEVOPS_USERNAME")
	tests := []struct {
		name   string
		args   fetchOption
		expect expectResult
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
			expect: expectResult{
				err:          nil,
				matchedCount: 19,
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
			expect: expectResult{
				shouldFail: true,
				err:        ErrIncorrectRepositoryURL,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			paths, err := client.listFiles(context.TODO(), tt.args)
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
