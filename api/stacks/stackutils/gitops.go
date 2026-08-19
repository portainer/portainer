package stackutils

import (
	"context"
	"fmt"

	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/git"
	gittypes "github.com/portainer/portainer/api/git/types"
)

var (
	ErrStackAlreadyExists     = errors.New("A stack already exists with this name")
	ErrWebhookIDAlreadyExists = errors.New("A webhook ID already exists")
)

// DownloadGitRepository downloads the target git repository on the disk
// The first return value represents the commit hash of the downloaded git repository
func DownloadGitRepository(ctx context.Context, config gittypes.RepoConfig, gitService portainer.GitService, getProjectPath func() string) (string, error) {
	username := ""
	password := ""
	if config.Authentication != nil {
		username = config.Authentication.Username
		password = config.Authentication.Password
	}

	projectPath := getProjectPath()
	err := gitService.CloneRepository(
		ctx,
		projectPath,
		config.URL,
		config.ReferenceName,
		username,
		password,
		config.TLSSkipVerify,
	)
	if err != nil {
		if errors.Is(err, gittypes.ErrAuthenticationFailure) {
			newErr := git.ErrInvalidGitCredential
			return "", newErr
		}

		newErr := fmt.Errorf("unable to clone git repository: %w", err)
		return "", newErr
	}

	commitID, err := gitService.LatestCommitID(
		ctx,
		config.URL,
		config.ReferenceName,
		username,
		password,
		config.TLSSkipVerify,
	)
	if err != nil {
		newErr := fmt.Errorf("unable to fetch git repository id: %w", err)
		return "", newErr
	}
	return commitID, nil
}
