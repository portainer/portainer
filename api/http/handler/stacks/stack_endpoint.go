package stacks

import (
	"errors"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
)

var errStackEndpointMismatch = errors.New("the stack does not belong to the requested environment")

// resolveStackEndpointID returns the environment a stack operation must be
// authorized against. The endpointId query parameter exists only to associate
// an environment with legacy stacks that have none recorded, so it may only
// re-bind a stack whose EndpointID is still 0, and only for an administrator.
// Any other mismatch between the stored and the requested environment is
// rejected before the stack is touched, so the stack's own environment and
// resource control are always the ones that are checked.
func resolveStackEndpointID(
	sc *security.RestrictedRequestContext,
	stack *portainer.Stack,
	requestedID portainer.EndpointID,
) (portainer.EndpointID, *httperror.HandlerError) {
	if requestedID == 0 || requestedID == stack.EndpointID {
		return stack.EndpointID, nil
	}

	if stack.EndpointID != 0 || !sc.IsAdmin {
		return 0, httperror.Forbidden("Permission denied to access environment", errStackEndpointMismatch)
	}

	return requestedID, nil
}
