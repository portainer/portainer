package docker

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/stretchr/testify/assert"
)

func TestTransport_updateDefaultGitBranch(t *testing.T) {
	type fields struct {
		gitService portainer.GitService
	}

	type args struct {
		request *http.Request
	}

	commitId := "my-latest-commit-id"

	defaultFields := fields{
		gitService: testhelpers.NewGitService(nil, commitId),
	}

	tests := []struct {
		name          string
		fields        fields
		args          args
		wantErr       bool
		expectedQuery string
	}{
		{
			name:   "append commit ID",
			fields: defaultFields,
			args: args{
				request: httptest.NewRequest(http.MethodPost, "http://unixsocket/build?dockerfile=Dockerfile&remote=https://my-host.com/my-user/my-repo.git&t=my-image", nil),
			},
			wantErr:       false,
			expectedQuery: fmt.Sprintf("dockerfile=Dockerfile&remote=https%%3A%%2F%%2Fmy-host.com%%2Fmy-user%%2Fmy-repo.git%%23%s&t=my-image", commitId),
		},
		{
			name:   "not append commit ID",
			fields: defaultFields,
			args: args{
				request: httptest.NewRequest(http.MethodPost, "http://unixsocket/build?dockerfile=Dockerfile&remote=https://my-host.com/my-user/my-repo/my-file&t=my-image", nil),
			},
			wantErr:       false,
			expectedQuery: "dockerfile=Dockerfile&remote=https://my-host.com/my-user/my-repo/my-file&t=my-image",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			transport := &Transport{
				gitService: tt.fields.gitService,
			}
			err := transport.updateDefaultGitBranch(tt.args.request)
			if (err != nil) != tt.wantErr {
				t.Errorf("updateDefaultGitBranch() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			assert.Equal(t, tt.expectedQuery, tt.args.request.URL.RawQuery)
		})
	}
}
