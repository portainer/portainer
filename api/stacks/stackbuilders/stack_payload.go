package stackbuilders

import (
	portainer "github.com/portainer/portainer/api"
)

// StackPayload contains all the fields for creating a stack with all kinds of methods
type StackPayload struct {
	// Name of the stack
	Name string `example:"myStack" validate:"required"`
	// Swarm cluster identifier
	SwarmID string `example:"jpofkc0i9uo9wtx1zesuk649w" validate:"required"`
	// Stack file data in byte format. Used by file upload method
	StackFileContentBytes []byte
	// Stack file data in string format. Used by file content method
	StackFileContent string
	Webhook          string
	// A list of environment(endpoint) variables used during stack deployment
	Env []portainer.Pair
	// Optional GitOps update configuration
	AutoUpdate *portainer.AutoUpdateSettings
	// Whether the stack is from a app template
	FromAppTemplate bool `example:"false"`
	// Kubernetes stack name
	StackName string
	// Kubernetes stack namespace
	Namespace string
	// Path to the k8s Stack file. Used by k8s git repository method
	ManifestFile string
	// URL to the k8s Stack file. Used by k8s git repository method
	ManifestURL string
	// Path to the Stack file inside the Git repository
	ComposeFile string `example:"docker-compose.yml" default:"docker-compose.yml"`
	// Applicable when deploying with multiple stack files
	AdditionalFiles []string `example:"[nz.compose.yml, uat.compose.yml]"`
	// Git repository configuration of a stack
	RepositoryConfigPayload
}

type RepositoryConfigPayload struct {
	// URL of a Git repository hosting the Stack file
	URL string `example:"https://github.com/openfaas/faas" validate:"required"`
	// Reference name of a Git repository hosting the Stack file
	ReferenceName string `example:"refs/heads/master"`
	// Use basic authentication to clone the Git repository
	Authentication bool `example:"true"`
	// Username used in basic authentication. Required when RepositoryAuthentication is true
	// and RepositoryGitCredentialID is 0
	Username string `example:"myGitUsername"`
	// Password used in basic authentication. Required when RepositoryAuthentication is true
	// and RepositoryGitCredentialID is 0
	Password string `example:"myGitPassword"`
	// TLSSkipVerify skips SSL verification when cloning the Git repository
	TLSSkipVerify bool `example:"false"`
}
