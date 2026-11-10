package stacks

import (
	"net/http"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
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
