package stackutils

import (
	"fmt"
	"regexp"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/filesystem"
)

func UserIsAdminOrEndpointAdmin(user *portainer.User, endpointID portainer.EndpointID) (bool, error) {
	isAdmin := user.Role == portainer.AdministratorRole

	return isAdmin, nil
}

// GetStackFilePaths returns a list of file paths based on stack project path
func GetStackFilePaths(stack *portainer.Stack, absolute bool) []string {
	if !absolute {
		return append([]string{stack.EntryPoint}, stack.AdditionalFiles...)
	}

	var filePaths []string
	for _, file := range append([]string{stack.EntryPoint}, stack.AdditionalFiles...) {
		filePaths = append(filePaths, filesystem.JoinPaths(stack.ProjectPath, file))
	}

	return filePaths
}

// ResourceControlID returns the stack resource control id
func ResourceControlID(endpointID portainer.EndpointID, name string) string {
	return fmt.Sprintf("%d_%s", endpointID, name)
}

// convert string to valid kubernetes label by replacing invalid characters with periods
func SanitizeLabel(value string) string {
	re := regexp.MustCompile(`[^A-Za-z0-9\.\-\_]+`)
	return re.ReplaceAllString(value, ".")
}
