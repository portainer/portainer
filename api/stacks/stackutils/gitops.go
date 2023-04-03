package stackutils

import (
	"fmt"

	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
	gittypes "github.com/portainer/portainer/api/git/types"
)

var (
	ErrStackAlreadyExists     = errors.New("A stack already exists with this name")
	ErrWebhookIDAlreadyExists = errors.New("A webhook ID already exists")
	ErrInvalidGitCredential   = errors.New("Invalid git credential")
)

// DownloadGitRepository downloads the target git repository on the disk
// The first return value represents the commit hash of the downloaded git repository
func DownloadGitRepository(stackID portainer.StackID, config gittypes.RepoConfig, gitService portainer.GitService, fileService portainer.FileService) (string, error) {
	username := ""
	password := ""
	if config.Authentication != nil {
		username = config.Authentication.Username
		password = config.Authentication.Password
	}

	stackFolder := fmt.Sprintf("%d", stackID)
	projectPath := fileService.GetStackProjectPath(stackFolder)

	err := gitService.CloneRepository(projectPath, config.URL, config.ReferenceName, username, password, config.TLSSkipVerify)
	if err != nil {
		if err == gittypes.ErrAuthenticationFailure {
			newErr := ErrInvalidGitCredential
			return "", newErr
		}

		newErr := fmt.Errorf("unable to clone git repository: %w", err)
		return "", newErr
	}

	commitID, err := gitService.LatestCommitID(config.URL, config.ReferenceName, username, password, config.TLSSkipVerify)
	if err != nil {
		newErr := fmt.Errorf("unable to fetch git repository id: %w", err)
		return "", newErr
	}
	return commitID, nil
}
