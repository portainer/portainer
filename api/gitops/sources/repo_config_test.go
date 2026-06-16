package sources

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/pkg/fips"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func init() {
	fips.InitFIPS(false)
}

func TestResolveRepoConfig_WithSourceID_ReturnsSourceConfig(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, false)

	src := &portainer.Source{
		Type: portainer.SourceTypeGit,
		Git: &gittypes.RepoConfig{
			URL:           "https://github.com/org/repo",
			TLSSkipVerify: true,
			Authentication: &gittypes.GitAuthentication{
				Username: "user",
				Password: "token",
			},
		},
	}
	require.NoError(t, store.Source().Create(src))

	cfg, httpErr := ResolveRepoConfig(store, RepoConfigInput{
		SourceID:       src.ID,
		ReferenceName:  "refs/heads/main",
		ConfigFilePath: "docker-compose.yml",
		RepositoryURL:  "https://ignored.example.com",
	})

	require.Nil(t, httpErr)
	assert.Equal(t, src.Git.URL, cfg.URL)
	assert.Equal(t, src.Git.Authentication, cfg.Authentication)
	assert.Equal(t, src.Git.TLSSkipVerify, cfg.TLSSkipVerify)
	assert.Equal(t, "refs/heads/main", cfg.ReferenceName)
	assert.Equal(t, "docker-compose.yml", cfg.ConfigFilePath)
}

func TestResolveRepoConfig_WithInlineURL_ReturnsInlineConfig(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, false)

	cfg, httpErr := ResolveRepoConfig(store, RepoConfigInput{
		ReferenceName:            "refs/heads/main",
		ConfigFilePath:           "docker-compose.yml",
		RepositoryURL:            "https://github.com/org/repo",
		TLSSkipVerify:            true,
		RepositoryAuthentication: true,
		Username:                 "user",
		Password:                 "pass",
	})

	require.Nil(t, httpErr)
	assert.Equal(t, "https://github.com/org/repo", cfg.URL)
	assert.True(t, cfg.TLSSkipVerify)
	require.NotNil(t, cfg.Authentication)
	assert.Equal(t, "user", cfg.Authentication.Username)
	assert.Equal(t, "pass", cfg.Authentication.Password)
}
