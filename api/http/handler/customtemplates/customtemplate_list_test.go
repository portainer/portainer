package customtemplates

import (
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/http/security"

	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/require"
)

func TestCustomTemplateList_PopulatesGitConfigFromSource(t *testing.T) {
	t.Parallel()

	handler, ds, _ := newTestHandler(t)

	var srcID portainer.SourceID
	require.NoError(t, ds.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{
			Type: portainer.SourceTypeGit,
			Git: &gittypes.GitSource{
				URL:           "https://github.com/example/repo",
				TLSSkipVerify: true,
			},
		}
		err := tx.Source().Create(adminUserContext, src)
		require.NoError(t, err)
		srcID = src.ID
		require.NoError(t, tx.CustomTemplate().Create(&portainer.CustomTemplate{
			ID: 1,
			Artifact: &portainer.Artifact{
				Files: []portainer.ArtifactFile{{
					Ref:      "refs/heads/main",
					Path:     "docker-compose.yml",
					Hash:     "abc123",
					SourceID: srcID,
				}},
			},
		}))
		require.NoError(t, tx.CustomTemplate().Create(&portainer.CustomTemplate{ID: 2, EntryPoint: "docker-compose.yml"}))

		return nil
	}))

	r := httptest.NewRequest(http.MethodGet, "/custom_templates", nil)
	r = r.WithContext(security.StoreRestrictedRequestContext(r, &security.RestrictedRequestContext{UserID: 1, IsAdmin: true, User: &portainer.User{ID: 1, Role: portainer.AdministratorRole}}))
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, r)

	require.Equal(t, http.StatusOK, rr.Code)

	var templates []portainer.CustomTemplate
	require.NoError(t, json.NewDecoder(rr.Body).Decode(&templates))

	var gitTemplate portainer.CustomTemplate
	for _, tpl := range templates {
		if tpl.ID == 1 {
			gitTemplate = tpl
		}
	}

	require.NotNil(t, gitTemplate.GitConfig)
	require.Equal(t, "https://github.com/example/repo", gitTemplate.GitConfig.URL)
	require.True(t, gitTemplate.GitConfig.TLSSkipVerify)
	require.Equal(t, "refs/heads/main", gitTemplate.GitConfig.ReferenceName)
	require.Equal(t, "docker-compose.yml", gitTemplate.GitConfig.ConfigFilePath)
	require.Equal(t, "abc123", gitTemplate.GitConfig.ConfigHash)

	var plainTemplate portainer.CustomTemplate
	for _, tpl := range templates {
		if tpl.ID == 2 {
			plainTemplate = tpl
		}
	}
	require.Nil(t, plainTemplate.GitConfig)
}

func TestCustomTemplateList_StripsPasswordFromGitConfig(t *testing.T) {
	t.Parallel()

	handler, ds, _ := newTestHandler(t)

	var srcID portainer.SourceID
	require.NoError(t, ds.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{
			Type: portainer.SourceTypeGit,
			Git: &gittypes.GitSource{
				URL: "https://github.com/example/repo",
				Authentication: &gittypes.GitAuthentication{
					Username: "user",
					Password: "topsecret",
				},
			},
		}
		err := tx.Source().Create(adminUserContext, src)
		require.NoError(t, err)
		srcID = src.ID
		require.NoError(t, tx.CustomTemplate().Create(&portainer.CustomTemplate{
			ID: 1,
			Artifact: &portainer.Artifact{
				Files: []portainer.ArtifactFile{{SourceID: srcID}},
			},
		}))

		return nil
	}))

	r := httptest.NewRequest(http.MethodGet, "/custom_templates", nil)
	r = r.WithContext(security.StoreRestrictedRequestContext(r, &security.RestrictedRequestContext{UserID: 1, IsAdmin: true, User: &portainer.User{ID: 1, Role: portainer.AdministratorRole}}))
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, r)

	require.Equal(t, http.StatusOK, rr.Code)

	var templates []portainer.CustomTemplate
	require.NoError(t, json.NewDecoder(rr.Body).Decode(&templates))
	require.Len(t, templates, 1)
	require.NotNil(t, templates[0].GitConfig)
	require.NotNil(t, templates[0].GitConfig.Authentication)
	require.Equal(t, "user", templates[0].GitConfig.Authentication.Username)
	require.Empty(t, templates[0].GitConfig.Authentication.Password)
}
