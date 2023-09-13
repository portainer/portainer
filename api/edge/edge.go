package edge

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/filesystem"
)

type (

	// StackPayload represents the payload sent to the agent
	StackPayload struct {
		// ID of the stack
		ID int
		// Name of the stack
		Name string

		// Content of the stack file (for compatibility to agent version less than 2.19.0)
		StackFileContent string

		// Content of stack folder
		DirEntries []filesystem.DirEntry
		// Name of the stack entry file
		EntryFileName string
		// Namespace to use for kubernetes stack. Keep empty to use the manifest namespace.
		Namespace string
		// Version of the stack file
		Version int
		// RollbackTo specifies the stack file version to rollback to (only support to rollback to the last version currently)
		RollbackTo *int

		// RegistryCredentials holds the credentials for a Docker registry.
		// Used only for EE
		RegistryCredentials []RegistryCredentials
		// PrePullImage is a flag indicating if the agent should pull the image before deploying the stack.
		// Used only for EE
		PrePullImage bool
		// RePullImage is a flag indicating if the agent should pull the image if it is already present on the node.
		// Used only for EE
		RePullImage bool
		// RetryDeploy is a flag indicating if the agent should retry to deploy the stack if it fails.
		// Used only for EE
		RetryDeploy bool
		// EdgeUpdateID is the ID of the edge update related to this stack.
		// Used only for EE
		EdgeUpdateID int

		// Is relative path supported
		SupportRelativePath bool
		// Mount point for relative path
		FilesystemPath string
		// Used only for EE
		// EnvVars is a list of environment variables to inject into the stack
		EnvVars []portainer.Pair
	}

	// RegistryCredentials holds the credentials for a Docker registry.
	RegistryCredentials struct {
		ServerURL string
		Username  string
		Secret    string
	}
)
