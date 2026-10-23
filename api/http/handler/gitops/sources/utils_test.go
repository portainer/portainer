package sources

import (
	"testing"

	gittypes "github.com/portainer/portainer/api/git/types"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestRedactWorkflowCredentials(t *testing.T) {
	t.Parallel()

	t.Run("clears password and preserves username", func(t *testing.T) {
		t.Parallel()
		wfs := []Workflow{{GitConfig: &gittypes.RepoConfig{
			Authentication: &gittypes.GitAuthentication{Username: "user", Password: "s3cr3t"},
		}}}
		got := RedactWorkflowCredentials(wfs)
		require.NotNil(t, got[0].GitConfig.Authentication)
		assert.Equal(t, "user", got[0].GitConfig.Authentication.Username)
		assert.Empty(t, got[0].GitConfig.Authentication.Password)
	})

	t.Run("does not mutate the original slice", func(t *testing.T) {
		t.Parallel()
		wfs := []Workflow{{GitConfig: &gittypes.RepoConfig{
			Authentication: &gittypes.GitAuthentication{Password: "s3cr3t"},
		}}}
		_ = RedactWorkflowCredentials(wfs)
		assert.Equal(t, "s3cr3t", wfs[0].GitConfig.Authentication.Password)
	})

	t.Run("nil GitConfig is safe", func(t *testing.T) {
		t.Parallel()
		assert.NotPanics(t, func() { RedactWorkflowCredentials([]Workflow{{}}) })
	})

	t.Run("nil Authentication is safe", func(t *testing.T) {
		t.Parallel()
		wfs := []Workflow{{GitConfig: &gittypes.RepoConfig{}}}
		assert.NotPanics(t, func() { RedactWorkflowCredentials(wfs) })
	})
}

func TestBuildConnectionInfo(t *testing.T) {
	t.Parallel()

	assert.Equal(t, connectionInfo{}, buildConnectionInfo(nil))

	cfg := &gittypes.GitSource{
		TLSSkipVerify:  true,
		Authentication: &gittypes.GitAuthentication{Username: "user"},
	}
	got := buildConnectionInfo(cfg)
	assert.True(t, got.TLSSkipVerify)
	require.NotNil(t, got.Authentication)
	assert.Equal(t, "user", got.Authentication.Username)

	got = buildConnectionInfo(&gittypes.GitSource{})
	assert.Nil(t, got.Authentication)
}
