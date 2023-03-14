package gittypes

import "errors"

var (
	ErrIncorrectRepositoryURL = errors.New("git repository could not be found, please ensure that the URL is correct")
	ErrAuthenticationFailure  = errors.New("authentication failed, please ensure that the git credentials are correct")
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
	// TLSSkipVerify skips SSL verification when cloning the Git repository
	TLSSkipVerify bool `example:"false"`
}

type GitAuthentication struct {
	Username string
	Password string
	// Git credentials identifier when the value is not 0
	// When the value is 0, Username and Password are set without using saved credential
	// This is introduced since 2.15.0
	GitCredentialID int `example:"0"`
}
