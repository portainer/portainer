package exec

import (
	"path"

	portainer "github.com/portainer/portainer/api"
)

func getStackFilePaths(stack *portainer.Stack) []string {
	var filePaths []string
	for _, file := range append([]string{stack.EntryPoint}, stack.AdditionalFiles...) {
		filePaths = append(filePaths, path.Join(stack.ProjectPath, file))
	}
	return filePaths
}
