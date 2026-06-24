package sources

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices/source"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/pkg/fips"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
)

// RepoConfigInput holds the raw payload fields needed to resolve a git RepoConfig.
// Set SourceID to resolve URL/auth from a stored source; otherwise provide the inline fields.
type RepoConfigInput struct {
	SourceID                 portainer.SourceID
	ReferenceName            string
	ConfigFilePath           string
	RepositoryURL            string
	TLSSkipVerify            bool
	RepositoryAuthentication bool
	Username                 string
	Password                 string
	Provider                 gittypes.GitProvider
	AuthorizationType        gittypes.GitCredentialAuthType
}

// ResolveRepoConfig builds a RepoConfig from either a SourceID or inline URL/auth fields.
func ResolveRepoConfig(tx gitSourceStore, userContext source.UserContext, input RepoConfigInput) (gittypes.RepoConfig, *httperror.HandlerError) {
	cfg := gittypes.RepoConfig{
		ReferenceName:  input.ReferenceName,
		ConfigFilePath: input.ConfigFilePath,
	}

	if input.SourceID != 0 {
		src, httpErr := ValidateGitSourceAccess(tx, userContext, input.SourceID)
		if httpErr != nil {
			return gittypes.RepoConfig{}, httpErr
		}
		cfg.URL = src.Git.URL
		cfg.Authentication = src.Git.Authentication
		cfg.TLSSkipVerify = src.Git.TLSSkipVerify
	} else {
		cfg.URL = input.RepositoryURL
		cfg.TLSSkipVerify = input.TLSSkipVerify
		if input.RepositoryAuthentication {
			cfg.Authentication = &gittypes.GitAuthentication{
				Username:          input.Username,
				Password:          input.Password,
				Provider:          input.Provider,
				AuthorizationType: input.AuthorizationType,
			}
		}
	}

	cfg.TLSSkipVerify = cfg.TLSSkipVerify && fips.CanTLSSkipVerify()
	return cfg, nil
}
