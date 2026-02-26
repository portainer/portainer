package uac

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/stacks/stackutils"
)

func StackResourceControlGetter[
	TX txLike[RCS, TS, US],
	RCS rcServiceLike,
	TS teamServiceLike,
	US userServiceLike,
](
	tx TX,
	endpointID portainer.EndpointID,
) func(item portainer.Stack) (*portainer.ResourceControl, error) {
	return genericResourcControlGetter(tx, endpointID, ResourceContext[portainer.Stack]{
		RCType:   portainer.StackResourceControl,
		IDGetter: func(s portainer.Stack) string { return StackResourceControlID(s.EndpointID, s.Name) },
		// stacks don't have labels so we don't pass a getter
	})
}

// TODO: replace usage of stackutils function to this package
func StackResourceControlID(endpointID portainer.EndpointID, name string) string {
	return stackutils.ResourceControlID(endpointID, name)
}
