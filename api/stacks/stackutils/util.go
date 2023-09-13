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
// If absolute is false, the path sanitization step will be skipped, which makes the returning
// paths vulnerable to path traversal attacks. Thus, the followed function using the returning
// paths are responsible to sanitize the raw paths
// If absolute is true, the raw paths will be sanitized
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

// IsGitStack checks if the stack is a git stack or not
func IsGitStack(stack *portainer.Stack) bool {
	return stack.GitConfig != nil && len(stack.GitConfig.URL) != 0
}

// IsRelativePathStack checks if the stack is a git stack or not
func IsRelativePathStack(stack *portainer.Stack) bool {
	// Always return false in CE
	// This function is only for code consistency with EE
	return false
}
