package gittypes

import "errors"

var (
	ErrIncorrectRepositoryURL = errors.New("Git repository could not be found, please ensure that the URL is correct.")
	ErrAuthenticationFailure  = errors.New("Authentication failed, please ensure that the git credentials are correct.")
)

// RepoConfig represents a configuration for a repo
type RepoConfig struct {
	// The repo url
	URL string `example:"https://github.com/portainer/portainer.git"`
	// The reference name
	ReferenceName string `example:"refs/heads/branch_name"`
	// Path to where the config file is in this url/refName
	ConfigFilePath string `example:"docker-compose.yml"`
	// Git credentials
	Authentication *GitAuthentication
	// Repository hash
	ConfigHash string `example:"bc4c183d756879ea4d173315338110b31004b8e0"`
}

type GitAuthentication struct {
	Username string
	Password string
	// Git credentials identifier when the value is not 0
	// When the value is 0, Username and Password are set without using saved credential
	// This is introduced since 2.15.0
	GitCredentialID int `example:"0"`
}

// RepoConfigV2 binds the basic git repository information with extra paths information
type RepoConfigV2 struct {
	RepoConfig
	// Path to the Stack file inside the Git repository
	ConfigFilePath string `example:"docker-compose.yml" default:"docker-compose.yml"`
	// Applicable when deploying with multiple stack files
	AdditionalFiles []string `example:"[nz.compose.yml, uat.compose.yml]"`
	// The name of directory where the repository is cloned to
	DirectoryName string `example:"myStack_jpofkc0i9uo9wtx1zesuk649w"`
	// First git repository if true
	Main bool
}
