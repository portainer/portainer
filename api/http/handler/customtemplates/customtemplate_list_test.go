package customtemplates

import (
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/slicesx"

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

func TestCustomTemplateList_AccessControl(t *testing.T) {
	t.Parallel()

	handler, ds, _ := newTestHandler(t)

	require.NoError(t, ds.UpdateTx(func(tx dataservices.DataStoreTx) error {
		// template 1 has no resource control
		require.NoError(t, tx.CustomTemplate().Create(&portainer.CustomTemplate{ID: 1, CreatedByUserID: 1}))

		// template 2 is public
		require.NoError(t, tx.CustomTemplate().Create(&portainer.CustomTemplate{ID: 2, CreatedByUserID: 1}))
		require.NoError(t, tx.ResourceControl().Create(&portainer.ResourceControl{
			ID: 2, ResourceID: "2", Type: portainer.CustomTemplateResourceControl,
			Public: true,
		}))

		// template 3 is shared directly with user 2
		require.NoError(t, tx.CustomTemplate().Create(&portainer.CustomTemplate{ID: 3, CreatedByUserID: 1}))
		require.NoError(t, tx.ResourceControl().Create(&portainer.ResourceControl{
			ID: 3, ResourceID: "3", Type: portainer.CustomTemplateResourceControl,
			UserAccesses: []portainer.UserResourceAccess{{UserID: 2}},
		}))

		// template 4 is shared with team 1
		require.NoError(t, tx.CustomTemplate().Create(&portainer.CustomTemplate{ID: 4, CreatedByUserID: 1}))
		require.NoError(t, tx.ResourceControl().Create(&portainer.ResourceControl{
			ID: 4, ResourceID: "4", Type: portainer.CustomTemplateResourceControl,
			TeamAccesses: []portainer.TeamResourceAccess{{TeamID: 1}},
		}))

		// template 5 was created by user 2, who has access
		require.NoError(t, tx.CustomTemplate().Create(&portainer.CustomTemplate{ID: 5, CreatedByUserID: 2}))
		require.NoError(t, tx.ResourceControl().Create(&portainer.ResourceControl{
			ID: 5, ResourceID: "5", Type: portainer.CustomTemplateResourceControl,
			UserAccesses: []portainer.UserResourceAccess{{UserID: 2}},
		}))

		// template 6 is shared only with user 4
		require.NoError(t, tx.CustomTemplate().Create(&portainer.CustomTemplate{ID: 6, CreatedByUserID: 1}))
		require.NoError(t, tx.ResourceControl().Create(&portainer.ResourceControl{
			ID: 6, ResourceID: "6", Type: portainer.CustomTemplateResourceControl,
			UserAccesses: []portainer.UserResourceAccess{{UserID: 4}},
		}))

		// template 7 was created by user 2 and has no resource control
		require.NoError(t, tx.CustomTemplate().Create(&portainer.CustomTemplate{ID: 7, CreatedByUserID: 2}))

		// template 8 was created by user 2 and is restricted to administrators
		require.NoError(t, tx.CustomTemplate().Create(&portainer.CustomTemplate{ID: 8, CreatedByUserID: 2}))
		require.NoError(t, tx.ResourceControl().Create(&portainer.ResourceControl{
			ID: 8, ResourceID: "8", Type: portainer.CustomTemplateResourceControl,
			AdministratorsOnly: true,
		}))

		// template 9 was created by user 2 and is shared only with user 3
		require.NoError(t, tx.CustomTemplate().Create(&portainer.CustomTemplate{ID: 9, CreatedByUserID: 2}))
		require.NoError(t, tx.ResourceControl().Create(&portainer.ResourceControl{
			ID: 9, ResourceID: "9", Type: portainer.CustomTemplateResourceControl,
			UserAccesses: []portainer.UserResourceAccess{{UserID: 3}},
		}))

		// template 10 was created by user 3 and is shared with team 1
		require.NoError(t, tx.CustomTemplate().Create(&portainer.CustomTemplate{ID: 10, CreatedByUserID: 3}))
		require.NoError(t, tx.ResourceControl().Create(&portainer.ResourceControl{
			ID: 10, ResourceID: "10", Type: portainer.CustomTemplateResourceControl,
			TeamAccesses: []portainer.TeamResourceAccess{{TeamID: 1}},
		}))

		return nil
	}))

	tests := []struct {
		name        string
		context     *security.RestrictedRequestContext
		expectedIDs []portainer.CustomTemplateID
	}{
		{
			name: "admin sees every template",
			context: &security.RestrictedRequestContext{
				UserID:  1,
				IsAdmin: true,
				User:    &portainer.User{ID: 1, Role: portainer.AdministratorRole},
			},
			expectedIDs: []portainer.CustomTemplateID{1, 2, 3, 4, 5, 6, 7, 8, 9, 10},
		},
		{
			name: "user 2 sees public, directly shared and own templates",
			context: &security.RestrictedRequestContext{
				UserID: 2,
				User:   &portainer.User{ID: 2, Role: portainer.StandardUserRole},
			},
			expectedIDs: []portainer.CustomTemplateID{2, 3, 5},
		},
		{
			name: "user 3 sees public, directly shared and team shared templates",
			context: &security.RestrictedRequestContext{
				UserID:          3,
				User:            &portainer.User{ID: 3, Role: portainer.StandardUserRole},
				UserMemberships: []portainer.TeamMembership{{ID: 1, UserID: 3, TeamID: 1}},
			},
			expectedIDs: []portainer.CustomTemplateID{2, 4, 9, 10},
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			r := httptest.NewRequest(http.MethodGet, "/custom_templates", nil)
			r = r.WithContext(security.StoreRestrictedRequestContext(r, tc.context))
			rr := httptest.NewRecorder()
			handler.ServeHTTP(rr, r)

			require.Equal(t, http.StatusOK, rr.Code)

			var templates []portainer.CustomTemplate
			require.NoError(t, json.NewDecoder(rr.Body).Decode(&templates))

			ids := slicesx.Map(templates, func(customTemplate portainer.CustomTemplate) portainer.CustomTemplateID {
				return customTemplate.ID
			})

			require.ElementsMatch(t, tc.expectedIDs, ids)
		})
	}
}
