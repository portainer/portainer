package stackutils

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
)

// ResourceControlID returns the stack resource control id
func ResourceControlID(stack *portainer.Stack) string {
	return fmt.Sprintf("%d_%s", stack.EndpointID, stack.Name)
}
