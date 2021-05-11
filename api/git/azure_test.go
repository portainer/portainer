package git

import (
	"github.com/stretchr/testify/assert"
	"net/url"
	"testing"
)

func Test_buildDownloadUrl(t *testing.T) {
	u, err := buildDownloadUrl(&azureOptions{
		organisation: "organisation",
		project:      "project",
		repository:   "repository",
	}, "refs/heads/main")

	expectedUrl, _ := url.Parse("https://dev.azure.com/organisation/project/_apis/git/repositories/repository/items?scopePath=/&download=true&versionDescriptor.version=refs/heads/main&$format=zip&recursionLevel=full&api-version=6.0")
	actualUrl, _ := url.Parse(u)
	if assert.NoError(t, err) {
		assert.Equal(t, expectedUrl.Host, actualUrl.Host)
		assert.Equal(t, expectedUrl.Scheme, actualUrl.Scheme)
		assert.Equal(t, expectedUrl.Path, actualUrl.Path)
		assert.Equal(t, expectedUrl.Query(), actualUrl.Query())
	}
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