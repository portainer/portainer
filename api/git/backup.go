package git

import (
	"fmt"

	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/filesystem"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/rs/zerolog/log"
)

var (
	ErrInvalidGitCredential = errors.New("Invalid git credential")
)

type CloneOptions struct {
	ProjectPath   string
	URL           string
	ReferenceName string
	Username      string
	Password      string
	// TLSSkipVerify skips SSL verification when cloning the Git repository
	TLSSkipVerify bool `example:"false"`
}

func CloneWithBackup(gitService portainer.GitService, fileService portainer.FileService, options CloneOptions) (clean func(), err error) {
	backupProjectPath := fmt.Sprintf("%s-old", options.ProjectPath)
	cleanUp := false
	cleanFn := func() {
		if !cleanUp {
			return
		}

		err = fileService.RemoveDirectory(backupProjectPath)
		if err != nil {
			log.Warn().Err(err).Msg("unable to remove git repository directory")
		}
	}

	err = filesystem.MoveDirectory(options.ProjectPath, backupProjectPath)
	if err != nil {
		return cleanFn, errors.WithMessage(err, "Unable to move git repository directory")
	}

	cleanUp = true

	err = gitService.CloneRepository(options.ProjectPath, options.URL, options.ReferenceName, options.Username, options.Password, options.TLSSkipVerify)
	if err != nil {
		cleanUp = false
		restoreError := filesystem.MoveDirectory(backupProjectPath, options.ProjectPath)
		if restoreError != nil {
			log.Warn().Err(restoreError).Msg("failed restoring backup folder")
		}

		if errors.Is(err, gittypes.ErrAuthenticationFailure) {
			return cleanFn, errors.WithMessage(err, ErrInvalidGitCredential.Error())
		}

		return cleanFn, errors.WithMessage(err, "Unable to clone git repository")
	}

	return cleanFn, nil
}
