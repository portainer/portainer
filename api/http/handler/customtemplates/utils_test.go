package customtemplates

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	gittypes "github.com/portainer/portainer/api/git/types"

	"github.com/stretchr/testify/require"
)

func TestPopulateGitConfig_NilArtifactIsNoOp(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, false, true)

	template := &portainer.CustomTemplate{ID: 1}

	err := store.ViewTx(func(tx dataservices.DataStoreTx) error {

		populateGitConfig(tx, adminUserContext, template)

		return nil
	})
	require.NoError(t, err)
	require.Nil(t, template.GitConfig)
}

func TestPopulateGitConfig_EmptySourceIDsIsNoOp(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, false, true)

	template := &portainer.CustomTemplate{
		ID: 1,
		Artifact: &portainer.Artifact{
			Files: []portainer.ArtifactFile{},
		},
	}

	err := store.ViewTx(func(tx dataservices.DataStoreTx) error {
		populateGitConfig(tx, adminUserContext, template)

		return nil
	})
	require.NoError(t, err)
	require.Nil(t, template.GitConfig)
}

func TestPopulateGitConfig_PopulatesFromSourceAndArtifact(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, false, true)

	var srcID portainer.SourceID
	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{
			Type: portainer.SourceTypeGit,
			Git: &gittypes.RepoConfig{
				URL:           "https://github.com/example/repo",
				TLSSkipVerify: true,
			},
		}
		err := tx.Source().Create(adminUserContext, src)
		require.NoError(t, err)
		srcID = src.ID

		return nil
	})
	require.NoError(t, err)

	template := &portainer.CustomTemplate{
		ID: 1,
		Artifact: &portainer.Artifact{
			Files: []portainer.ArtifactFile{{
				Ref:      "refs/heads/main",
				Path:     "docker-compose.yml",
				Hash:     "abc123",
				SourceID: srcID,
			}},
		},
	}

	err = store.ViewTx(func(tx dataservices.DataStoreTx) error {
		populateGitConfig(tx, adminUserContext, template)

		return nil
	})
	require.NoError(t, err)
	require.NotNil(t, template.GitConfig)
	require.Equal(t, "https://github.com/example/repo", template.GitConfig.URL)
	require.True(t, template.GitConfig.TLSSkipVerify)
	require.Equal(t, "refs/heads/main", template.GitConfig.ReferenceName)
	require.Equal(t, "docker-compose.yml", template.GitConfig.ConfigFilePath)
	require.Equal(t, "abc123", template.GitConfig.ConfigHash)
}

func TestPopulateGitConfig_StripsPassword(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, false, true)

	var srcID portainer.SourceID
	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{
			Type: portainer.SourceTypeGit,
			Git: &gittypes.RepoConfig{
				URL: "https://github.com/example/repo",
				Authentication: &gittypes.GitAuthentication{
					Username: "user",
					Password: "secret",
				},
			},
		}
		err := tx.Source().Create(adminUserContext, src)
		require.NoError(t, err)
		srcID = src.ID

		return nil
	})
	require.NoError(t, err)

	template := &portainer.CustomTemplate{
		ID: 1,
		Artifact: &portainer.Artifact{
			Files: []portainer.ArtifactFile{{SourceID: srcID}},
		},
	}

	err = store.ViewTx(func(tx dataservices.DataStoreTx) error {
		populateGitConfig(tx, adminUserContext, template)

		return nil
	})
	require.NoError(t, err)
	require.NotNil(t, template.GitConfig)
	require.NotNil(t, template.GitConfig.Authentication)
	require.Equal(t, "user", template.GitConfig.Authentication.Username)
	require.Empty(t, template.GitConfig.Authentication.Password)
}
