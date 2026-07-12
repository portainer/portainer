package stacks

import (
	"testing"

	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/stretchr/testify/require"
)

func TestResolveGitAuthFromRedeployPayload(t *testing.T) {
	t.Parallel()

	existing := &gittypes.GitAuthentication{
		Username: "existing-user",
		Password: "existing-pass",
	}

	tests := []struct {
		name    string
		auth    *gittypes.GitAuthentication
		payload stackGitRedeployPayload
		want    gittypes.GitAuthentication
	}{
		{
			name:    "no existing auth, flag off, no creds",
			auth:    nil,
			payload: stackGitRedeployPayload{RepositoryAuthentication: false},
			want:    gittypes.GitAuthentication{},
		},
		{
			name:    "no existing auth, flag off, creds provided",
			auth:    nil,
			payload: stackGitRedeployPayload{RepositoryAuthentication: false, RepositoryPassword: "pass"},
			want:    gittypes.GitAuthentication{},
		},
		{
			name:    "no existing auth, flag on, empty password",
			auth:    nil,
			payload: stackGitRedeployPayload{RepositoryAuthentication: true, RepositoryUsername: "user"},
			want:    gittypes.GitAuthentication{},
		},
		{
			name:    "no existing auth, flag on, password set",
			auth:    nil,
			payload: stackGitRedeployPayload{RepositoryAuthentication: true, RepositoryUsername: "user", RepositoryPassword: "pass"},
			want:    gittypes.GitAuthentication{Username: "user", Password: "pass"},
		},
		{
			name:    "no existing auth, flag on, password set but no username",
			auth:    nil,
			payload: stackGitRedeployPayload{RepositoryAuthentication: true, RepositoryPassword: "pass"},
			want:    gittypes.GitAuthentication{Username: "", Password: "pass"},
		},
		{
			name:    "existing auth, flag off",
			auth:    existing,
			payload: stackGitRedeployPayload{RepositoryAuthentication: false},
			want:    *existing,
		},
		{
			name:    "existing auth, flag on, empty password",
			auth:    existing,
			payload: stackGitRedeployPayload{RepositoryAuthentication: true, RepositoryUsername: "new-user"},
			want:    *existing,
		},
		{
			name:    "existing auth, flag on, password set",
			auth:    existing,
			payload: stackGitRedeployPayload{RepositoryAuthentication: true, RepositoryUsername: "new-user", RepositoryPassword: "new-pass"},
			want:    gittypes.GitAuthentication{Username: "new-user", Password: "new-pass"},
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			cfg := &gittypes.RepoConfig{Authentication: tc.auth}
			got := resolveGitAuthFromRedeployPayload(cfg, tc.payload)
			require.Equal(t, tc.want, got)
		})
	}
}
