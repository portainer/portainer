package git

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/filesystem"
	gittypes "github.com/portainer/portainer/api/git/types"

	"github.com/pkg/errors"
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
	backupProjectPath := options.ProjectPath + "-old"
	cleanUp := false
	cleanFn := func() {
		if !cleanUp {
			return
		}

		if err := fileService.RemoveDirectory(backupProjectPath); err != nil {
			log.Warn().Err(err).Msg("unable to remove git repository directory")
		}
	}

	if err := filesystem.MoveDirectory(options.ProjectPath, backupProjectPath, true); err != nil {
		return cleanFn, errors.WithMessage(err, "Unable to move git repository directory")
	}

	cleanUp = true

	if err := gitService.CloneRepository(options.ProjectPath, options.URL, options.ReferenceName, options.Username, options.Password, options.TLSSkipVerify); err != nil {
		cleanUp = false
		if err := filesystem.MoveDirectory(backupProjectPath, options.ProjectPath, false); err != nil {
			log.Warn().Err(err).Msg("failed restoring backup folder")
		}

		if errors.Is(err, gittypes.ErrAuthenticationFailure) {
			return cleanFn, errors.WithMessage(err, ErrInvalidGitCredential.Error())
		}

		return cleanFn, errors.WithMessage(err, "Unable to clone git repository")
	}

	return cleanFn, nil
}
