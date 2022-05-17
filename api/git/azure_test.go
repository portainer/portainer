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
	a := NewAzureDownloader(nil)
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
	a := NewAzureDownloader(nil)
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
		options cloneOptions
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
				options: cloneOptions{
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
				options: cloneOptions{
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
				options: cloneOptions{
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

			a := &azureDownloader{
				client:  server.Client(),
				baseUrl: server.URL,
			}
			_, err := a.downloadZipFromAzureDevOps(context.Background(), tt.args.options)
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

	a := &azureDownloader{
		client:  server.Client(),
		baseUrl: server.URL,
	}

	tests := []struct {
		name    string
		args    fetchOptions
		want    string
		wantErr bool
	}{
		{
			name: "should be able to parse response",
			args: fetchOptions{
				referenceName: "",
				repositoryUrl: "https://dev.azure.com/Organisation/Project/_git/Repository"},
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
