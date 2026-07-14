package sources

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	gittypes "github.com/portainer/portainer/api/git/types"
	ce "github.com/portainer/portainer/api/gitops/workflows"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestRedactWorkflowCredentials(t *testing.T) {
	t.Parallel()

	t.Run("clears password and preserves username", func(t *testing.T) {
		t.Parallel()
		wfs := []ce.SourceWorkflow{{GitConfig: &gittypes.RepoConfig{
			Authentication: &gittypes.GitAuthentication{Username: "user", Password: "s3cr3t"},
		}}}
		got := redactWorkflowCredentials(wfs)
		require.NotNil(t, got[0].GitConfig.Authentication)
		assert.Equal(t, "user", got[0].GitConfig.Authentication.Username)
		assert.Empty(t, got[0].GitConfig.Authentication.Password)
	})

	t.Run("does not mutate the original slice", func(t *testing.T) {
		t.Parallel()
		wfs := []ce.SourceWorkflow{{GitConfig: &gittypes.RepoConfig{
			Authentication: &gittypes.GitAuthentication{Password: "s3cr3t"},
		}}}
		_ = redactWorkflowCredentials(wfs)
		assert.Equal(t, "s3cr3t", wfs[0].GitConfig.Authentication.Password)
	})

	t.Run("nil GitConfig is safe", func(t *testing.T) {
		t.Parallel()
		assert.NotPanics(t, func() { redactWorkflowCredentials([]ce.SourceWorkflow{{}}) })
	})

	t.Run("nil Authentication is safe", func(t *testing.T) {
		t.Parallel()
		wfs := []ce.SourceWorkflow{{GitConfig: &gittypes.RepoConfig{}}}
		assert.NotPanics(t, func() { redactWorkflowCredentials(wfs) })
	})
}

func TestBuildAutoUpdateInfo(t *testing.T) {
	t.Parallel()

	assert.Nil(t, BuildAutoUpdateInfo(nil))
	assert.Nil(t, BuildAutoUpdateInfo(&portainer.AutoUpdateSettings{}))

	got := BuildAutoUpdateInfo(&portainer.AutoUpdateSettings{Interval: "5m"})
	require.NotNil(t, got)
	assert.Equal(t, "Interval", got.Mechanism)
	assert.Equal(t, "5m", got.FetchInterval)

	got = BuildAutoUpdateInfo(&portainer.AutoUpdateSettings{Webhook: "abc123"})
	require.NotNil(t, got)
	assert.Equal(t, "Webhook", got.Mechanism)
	assert.Empty(t, got.FetchInterval)
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
