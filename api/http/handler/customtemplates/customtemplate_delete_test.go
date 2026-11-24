package customtemplates

import (
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"

	"github.com/gorilla/mux"
	"github.com/stretchr/testify/require"
)

func TestCustomTemplateDelete_NotFound(t *testing.T) {
	t.Parallel()

	handler, _, _ := newTestHandler(t)

	r := httptest.NewRequest(http.MethodDelete, "/custom_templates/99", nil)
	r = mux.SetURLVars(r, map[string]string{"id": "99"})
	r = r.WithContext(security.StoreRestrictedRequestContext(r, &security.RestrictedRequestContext{UserID: 1, IsAdmin: true}))
	rr := httptest.NewRecorder()

	herr := handler.customTemplateDelete(rr, r)
	require.NotNil(t, herr)
	require.Equal(t, http.StatusNotFound, herr.StatusCode)
}

func TestCustomTemplateDelete_AccessControl(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name            string
		createdByUserID portainer.UserID
		resourceControl *portainer.ResourceControl
		context         *security.RestrictedRequestContext
		expectedStatus  int
	}{
		{
			name:            "non-creator is forbidden without resource control",
			createdByUserID: 1,
			context:         &security.RestrictedRequestContext{UserID: 2},
			expectedStatus:  http.StatusForbidden,
		},
		{
			name:            "creator is forbidden without resource control",
			createdByUserID: 2,
			context:         &security.RestrictedRequestContext{UserID: 2},
			expectedStatus:  http.StatusForbidden,
		},
		{
			name:            "creator is forbidden when an admin restricted the template to administrators",
			createdByUserID: 2,
			resourceControl: &portainer.ResourceControl{AdministratorsOnly: true},
			context:         &security.RestrictedRequestContext{UserID: 2},
			expectedStatus:  http.StatusForbidden,
		},
		{
			name:            "creator is forbidden when the resource control only grants access to another user",
			createdByUserID: 2,
			resourceControl: &portainer.ResourceControl{UserAccesses: []portainer.UserResourceAccess{{UserID: 3}}},
			context:         &security.RestrictedRequestContext{UserID: 2},
			expectedStatus:  http.StatusForbidden,
		},
		{
			name:            "non-creator is forbidden when the resource control only grants access to the creator",
			createdByUserID: 1,
			resourceControl: &portainer.ResourceControl{UserAccesses: []portainer.UserResourceAccess{{UserID: 1}}},
			context:         &security.RestrictedRequestContext{UserID: 2},
			expectedStatus:  http.StatusForbidden,
		},
		{
			name:            "non-creator with read access is forbidden",
			createdByUserID: 1,
			resourceControl: &portainer.ResourceControl{UserAccesses: []portainer.UserResourceAccess{{UserID: 2}}},
			context:         &security.RestrictedRequestContext{UserID: 2},
			expectedStatus:  http.StatusForbidden,
		},
		{
			name:            "creator with access can delete",
			createdByUserID: 2,
			resourceControl: &portainer.ResourceControl{UserAccesses: []portainer.UserResourceAccess{{UserID: 2}}},
			context:         &security.RestrictedRequestContext{UserID: 2},
			expectedStatus:  http.StatusNoContent,
		},
		{
			name:            "admin can delete a template restricted to administrators",
			createdByUserID: 2,
			resourceControl: &portainer.ResourceControl{AdministratorsOnly: true},
			context:         &security.RestrictedRequestContext{UserID: 1, IsAdmin: true},
			expectedStatus:  http.StatusNoContent,
		},
		{
			name:            "admin can delete template without resource control",
			createdByUserID: 2,
			context:         &security.RestrictedRequestContext{UserID: 1, IsAdmin: true},
			expectedStatus:  http.StatusNoContent,
		},
		{
			name:            "any user can delete a public template",
			createdByUserID: 1,
			resourceControl: &portainer.ResourceControl{Public: true},
			context:         &security.RestrictedRequestContext{UserID: 2},
			expectedStatus:  http.StatusNoContent,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			handler, store, _ := newTestHandler(t)

			err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
				err := tx.CustomTemplate().Create(&portainer.CustomTemplate{
					ID:              1,
					CreatedByUserID: tc.createdByUserID,
				})
				require.NoError(t, err)

				if tc.resourceControl == nil {
					return nil
				}

				tc.resourceControl.ID = 1
				tc.resourceControl.ResourceID = "1"
				tc.resourceControl.Type = portainer.CustomTemplateResourceControl

				return tx.ResourceControl().Create(tc.resourceControl)
			})
			require.NoError(t, err)

			r := httptest.NewRequest(http.MethodDelete, "/custom_templates/1", nil)
			r = mux.SetURLVars(r, map[string]string{"id": "1"})
			r = r.WithContext(security.StoreRestrictedRequestContext(r, tc.context))
			rr := httptest.NewRecorder()

			herr := handler.customTemplateDelete(rr, r)

			if tc.expectedStatus == http.StatusNoContent {
				require.Nil(t, herr)
				require.Equal(t, http.StatusNoContent, rr.Code)

				_ = store.ViewTx(func(tx dataservices.DataStoreTx) error {
					_, err := tx.CustomTemplate().Read(1)
					require.True(t, tx.IsErrObjectNotFound(err))

					return nil
				})
			} else {
				require.NotNil(t, herr)
				require.Equal(t, tc.expectedStatus, herr.StatusCode)
			}
		})
	}
}
