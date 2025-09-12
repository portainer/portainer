package customtemplates

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gorilla/mux"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/testhelpers"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/require"
)

func TestInspectHandler(t *testing.T) {
	_, ds := datastore.MustNewTestStore(t, true, false)
	require.NotNil(t, ds)

	require.NoError(t, ds.UpdateTx(func(tx dataservices.DataStoreTx) error {
		require.NoError(t, tx.User().Create(&portainer.User{ID: 1, Username: "admin", Role: portainer.AdministratorRole}))
		require.NoError(t, tx.User().Create(&portainer.User{ID: 2, Username: "std2", Role: portainer.StandardUserRole}))
		require.NoError(t, tx.User().Create(&portainer.User{ID: 3, Username: "std3", Role: portainer.StandardUserRole}))
		require.NoError(t, tx.User().Create(&portainer.User{ID: 4, Username: "std4", Role: portainer.StandardUserRole}))
		require.NoError(t, tx.Endpoint().Create(&portainer.Endpoint{ID: 1,
			UserAccessPolicies: portainer.UserAccessPolicies{
				2: portainer.AccessPolicy{RoleID: 0},
				3: portainer.AccessPolicy{RoleID: 0},
			}}))
		require.NoError(t, tx.Team().Create(&portainer.Team{ID: 1}))
		require.NoError(t, tx.TeamMembership().Create(&portainer.TeamMembership{ID: 1, UserID: 3, TeamID: 1, Role: portainer.TeamMember}))

		require.NoError(t, tx.CustomTemplate().Create(&portainer.CustomTemplate{ID: 1}))
		require.NoError(t, tx.CustomTemplate().Create(&portainer.CustomTemplate{ID: 2}))
		require.NoError(t, tx.ResourceControl().Create(&portainer.ResourceControl{ID: 1, ResourceID: "2", Type: portainer.CustomTemplateResourceControl,
			UserAccesses: []portainer.UserResourceAccess{{UserID: 2}},
			TeamAccesses: []portainer.TeamResourceAccess{{TeamID: 1}},
		}))
		return nil
	}))

	handler := NewHandler(testhelpers.NewTestRequestBouncer(), ds, &TestFileService{}, nil)

	test := func(templateID string, restrictedContext *security.RestrictedRequestContext) (*httptest.ResponseRecorder, *httperror.HandlerError) {
		r := httptest.NewRequest(http.MethodGet, "/custom_templates/"+templateID, nil)
		r = mux.SetURLVars(r, map[string]string{"id": templateID})
		ctx := security.StoreRestrictedRequestContext(r, restrictedContext)
		r = r.WithContext(ctx)
		rr := httptest.NewRecorder()
		return rr, handler.customTemplateInspect(rr, r)
	}

	t.Run("unknown id should get not found error", func(t *testing.T) {
		_, r := test("0", &security.RestrictedRequestContext{UserID: 1})
		require.NotNil(t, r)
		require.Equal(t, http.StatusNotFound, r.StatusCode)
	})

	t.Run("admin should access adminonly template", func(t *testing.T) {
		rr, r := test("1", &security.RestrictedRequestContext{UserID: 1, IsAdmin: true})
		require.Nil(t, r)
		require.Equal(t, http.StatusOK, rr.Result().StatusCode)
		var template portainer.CustomTemplate
		require.NoError(t, json.NewDecoder(rr.Body).Decode(&template))
		require.Equal(t, portainer.CustomTemplateID(1), template.ID)
	})

	t.Run("std should not access adminonly template", func(t *testing.T) {
		_, r := test("1", &security.RestrictedRequestContext{UserID: 2})
		require.NotNil(t, r)
		require.Equal(t, http.StatusForbidden, r.StatusCode)
	})

	t.Run("std should access template via direct user access", func(t *testing.T) {
		rr, r := test("2", &security.RestrictedRequestContext{UserID: 2})
		require.Nil(t, r)
		require.Equal(t, http.StatusOK, rr.Result().StatusCode)
		var template portainer.CustomTemplate
		require.NoError(t, json.NewDecoder(rr.Body).Decode(&template))
		require.Equal(t, portainer.CustomTemplateID(2), template.ID)
	})

	t.Run("std should access template via team access", func(t *testing.T) {
		rr, r := test("2", &security.RestrictedRequestContext{UserID: 3, UserMemberships: []portainer.TeamMembership{{ID: 1, UserID: 3, TeamID: 1}}})
		require.Nil(t, r)
		require.Equal(t, http.StatusOK, rr.Result().StatusCode)
		var template portainer.CustomTemplate
		require.NoError(t, json.NewDecoder(rr.Body).Decode(&template))
		require.Equal(t, portainer.CustomTemplateID(2), template.ID)
	})

	t.Run("std should not access template without access", func(t *testing.T) {
		_, r := test("2", &security.RestrictedRequestContext{UserID: 4})
		require.NotNil(t, r)
		require.Equal(t, http.StatusForbidden, r.StatusCode)
	})
}
