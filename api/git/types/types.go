package gittypes

import (
	"cmp"
	"errors"
	"net/url"
	"path"
	"strings"
)

var (
	ErrIncorrectRepositoryURL = errors.New("git repository could not be found, please ensure that the URL is correct")
	ErrAuthenticationFailure  = errors.New("authentication failed, please ensure that the git credentials are correct")
	ErrSymlinkDetected        = errors.New("repository contains a symlink, which is not allowed for security reasons")
)

type GitCredentialAuthType int

type GitProvider int

// RepoConfig represents a configuration for a repo
type RepoConfig struct {
	// The repo url
	URL string `example:"https://github.com/portainer/portainer.git"`
	// The reference name
	ReferenceName string `example:"refs/heads/branch_name"`
	// ConfigFilePath is the path to the config file within the repository.
	// NOTE: For stacks, this mirrors Stack.EntryPoint and the two are kept in sync by stackUpdateGit.
	ConfigFilePath string `example:"docker-compose.yml"`
	// Git credentials
	Authentication *GitAuthentication `json:",omitempty"`
	// Repository hash
	ConfigHash string `example:"bc4c183d756879ea4d173315338110b31004b8e0"`
	// TLSSkipVerify skips SSL verification when cloning the Git repository
	TLSSkipVerify bool `example:"false"`
}

// GitSource holds the shared connection fields stored on a Source.
// Per-file fields (ref, path, hash) are stored on ArtifactFile instead.
type GitSource struct {
	URL            string             `example:"https://github.com/portainer/portainer.git"`
	Authentication *GitAuthentication `json:",omitempty"`
	TLSSkipVerify  bool               `example:"false"`
}

// ToRepoConfig returns a RepoConfig populated with the connection fields from gc
func (gc *GitSource) ToRepoConfig() *RepoConfig {
	return &RepoConfig{
		URL:            gc.URL,
		Authentication: gc.Authentication,
		TLSSkipVerify:  gc.TLSSkipVerify,
	}
}

// SanitizeGitSource returns a copy of gc with the URL sanitized and password cleared,
// safe to return to clients
func SanitizeGitSource(gc *GitSource) *GitSource {
	if gc == nil {
		return nil
	}

	result := *gc
	result.URL = SanitizeURL(result.URL)

	if result.Authentication != nil && result.Authentication.Password != "" {
		auth := *result.Authentication
		auth.Password = ""
		result.Authentication = &auth
	}

	return &result
}

// RepoName extracts the repository name from a git URL for use as a display name.
// e.g. "https://github.com/org/app-config.git" results in "app-config"
func RepoName(rawURL string) string {
	return strings.TrimSuffix(path.Base(rawURL), ".git")
}

// NormalizeURL returns a canonical form of rawURL for deduplication purposes:
// scheme and host are lowercased, embedded credentials are removed, trailing
// slashes and the .git suffix are stripped from the path. If the scheme is
// absent it defaults to https.
func NormalizeURL(rawURL string) (string, error) {
	u, err := url.Parse(rawURL)
	if err != nil {
		return "", err
	}

	u.Scheme = strings.ToLower(cmp.Or(u.Scheme, "https"))
	u.Host = strings.ToLower(u.Host)
	u.User = nil
	u.Path = strings.TrimSuffix(strings.TrimRight(u.Path, "/"), ".git")

	return u.String(), nil
}

// SanitizeURL strips any userinfo (username/password) embedded in rawURL,
// returning a URL safe to store or return to clients.
func SanitizeURL(rawURL string) string {
	u, err := url.Parse(rawURL)
	if err != nil || u.User == nil {
		return rawURL
	}

	u.User = nil

	return u.String()
}

// SanitizeRepoConfig returns a copy of gc with the URL sanitized and password cleared,
// safe to return to clients.
func SanitizeRepoConfig(gc *RepoConfig) *RepoConfig {
	if gc == nil {
		return nil
	}

	result := *gc
	result.URL = SanitizeURL(result.URL)

	if result.Authentication != nil && result.Authentication.Password != "" {
		auth := *result.Authentication
		auth.Password = ""
		result.Authentication = &auth
	}

	return &result
}

type GitAuthentication struct {
	Username          string
	Password          string
	Provider          GitProvider           `json:",omitempty"`
	AuthorizationType GitCredentialAuthType `json:",omitempty"`
	GitCredentialID   int                   `json:",omitempty" example:"0"`
}
