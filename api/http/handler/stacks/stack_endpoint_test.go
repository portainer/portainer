package stacks

import (
	"net/http"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/testhelpers"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/stretchr/testify/require"
)

func TestResolveStackEndpointID(t *testing.T) {
	t.Parallel()

	admin := &security.RestrictedRequestContext{IsAdmin: true}
	standard := &security.RestrictedRequestContext{IsAdmin: false}

	forbiddenError := &httperror.HandlerError{
		StatusCode: http.StatusForbidden,
		Message:    "Permission denied to access environment",
		Err:        errStackEndpointMismatch,
	}

	tests := []struct {
		name               string
		ctx                *security.RestrictedRequestContext
		stored             portainer.EndpointID
		requested          portainer.EndpointID
		expectedEndpointID portainer.EndpointID
		expectedError      *httperror.HandlerError
	}{
		{
			name:               "no endpoint requested keeps the stored one",
			ctx:                standard,
			stored:             2,
			requested:          0,
			expectedEndpointID: 2,
		},
		{
			name:               "requested matches stored",
			ctx:                standard,
			stored:             2,
			requested:          2,
			expectedEndpointID: 2,
		},
		{
			name:          "standard user cannot move a stack to another environment",
			ctx:           standard,
			stored:        2,
			requested:     1,
			expectedError: forbiddenError,
		},
		{
			name:          "admin cannot move a stack to another environment",
			ctx:           admin,
			stored:        2,
			requested:     1,
			expectedError: forbiddenError,
		},
		{
			name:          "standard user cannot bind a legacy stack",
			ctx:           standard,
			stored:        0,
			requested:     1,
			expectedError: forbiddenError,
		},
		{
			name:               "admin can bind a legacy stack",
			ctx:                admin,
			stored:             0,
			requested:          1,
			expectedEndpointID: 1,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			stack := &portainer.Stack{ID: 1, EndpointID: tt.stored}
			got, httpErr := resolveStackEndpointID(tt.ctx, stack, tt.requested)

			if tt.expectedError != nil {
				require.Equal(t, tt.expectedError, httpErr)
				require.Equal(t, tt.stored, stack.EndpointID, "stack must not be mutated")
			} else {
				require.Nil(t, httpErr)
				require.Equal(t, tt.expectedEndpointID, got)
			}
		})
	}
}

func TestAuthorizeStackActionEndpointID(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, true, false)
	h := NewHandler(testhelpers.NewTestRequestBouncer(), nil)
	h.DataStore = store

	for _, id := range []portainer.EndpointID{1, 2} {
		err := store.Endpoint().Create(&portainer.Endpoint{ID: id})
		require.NoError(t, err)
	}

	admin := &security.RestrictedRequestContext{IsAdmin: true}
	standard := &security.RestrictedRequestContext{}

	f := func(sc *security.RestrictedRequestContext, stored, requested portainer.EndpointID, allowed bool) {
		t.Helper()

		httpErr := h.authorizeStackActionEndpointID(sc, &portainer.Stack{EndpointID: stored}, requested)
		if allowed {
			require.Nil(t, httpErr)

			return
		}

		require.NotNil(t, httpErr)
		require.Equal(t, http.StatusForbidden, httpErr.StatusCode)
		require.ErrorIs(t, httpErr.Err, errStackEndpointMismatch)
	}

	// standard user acting on the stack's own environment
	f(standard, 2, 2, true)

	// standard user targeting another environment
	f(standard, 2, 1, false)

	// standard user omitting the environment of a stack that has one
	f(standard, 2, 0, false)

	// admin targeting another environment while the stack's own environment still exists
	f(admin, 2, 1, false)

	// admin acting on an orphaned stack from another environment
	f(admin, 3, 1, true)

	// standard user acting on an orphaned stack from another environment
	f(standard, 3, 1, false)
}
