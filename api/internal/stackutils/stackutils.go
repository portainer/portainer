package stackutils

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
)

// ResourceControlID returns the stack resource control id
func ResourceControlID(endpointID portainer.EndpointID, name string) string {
	return fmt.Sprintf("%d_%s", endpointID, name)
}
