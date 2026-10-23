package update

import (
	"context"
	"os"
	"strings"
	"time"

	"github.com/pkg/errors"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/git"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/rs/zerolog/log"
)

// UpdateGitObject updates a git object based on its config
func UpdateGitObject(ctx context.Context, gitService portainer.GitService, objId string, gitConfig *gittypes.RepoConfig, enableVersionFolder bool, projectPath string) (bool, string, error) {
	if gitConfig == nil {
		return false, "", nil
	}

	log.Debug().
		Str("url", gitConfig.URL).
		Str("ref", gitConfig.ReferenceName).
		Str("object", objId).
		Msg("the object has a git config, try to poll from git repository")

	username, password := git.GetCredentials(gitConfig.Authentication)

	fetchCtx, cancel := context.WithTimeout(ctx, time.Minute)
	newHash, err := gitService.LatestCommitID(
		fetchCtx,
		gitConfig.URL,
		gitConfig.ReferenceName,
		username,
		password,
		gitConfig.TLSSkipVerify,
	)
	cancel()
	if err != nil {
		if fetchCtx.Err() == context.DeadlineExceeded {
			log.Error().Str("object", objId).Msg("git fetch timed out after 1 minute")
		}

		return false, "", errors.WithMessagef(err, "failed to fetch latest commit id of %v", objId)
	}

	hashChanged := !strings.EqualFold(newHash, gitConfig.ConfigHash)

	if !hashChanged {
		log.Debug().
			Str("hash", newHash).
			Str("url", gitConfig.URL).
			Str("ref", gitConfig.ReferenceName).
			Str("object", objId).
			Msg("git repo is up to date")

		return false, newHash, nil
	}

	toDir := projectPath
	if enableVersionFolder {
		toDir = filesystem.JoinPaths(projectPath, newHash)
	}

	cloneParams := &cloneRepositoryParameters{
		url:           gitConfig.URL,
		ref:           gitConfig.ReferenceName,
		toDir:         toDir,
		tlsSkipVerify: gitConfig.TLSSkipVerify,
	}
	if gitConfig.Authentication != nil {
		cloneParams.auth = &gitAuth{
			username: username,
			password: password,
		}
	}

	if err := cloneGitRepository(ctx, gitService, cloneParams); err != nil {
		if enableVersionFolder {
			if removeErr := os.RemoveAll(toDir); removeErr != nil {
				log.Warn().Err(removeErr).Str("dir", toDir).Msg("failed to remove partial clone directory")
			}
		}
		return false, "", errors.WithMessagef(err, "failed to do a fresh clone of %v", objId)
	}

	log.Debug().
		Str("hash", newHash).
		Str("url", gitConfig.URL).
		Str("ref", gitConfig.ReferenceName).
		Str("object", objId).
		Msg("git repo cloned updated")

	return true, newHash, nil
}

type cloneRepositoryParameters struct {
	url   string
	ref   string
	toDir string
	auth  *gitAuth
	// tlsSkipVerify skips SSL verification when cloning the Git repository
	tlsSkipVerify bool `example:"false"`
}

type gitAuth struct {
	username string
	password string
}

func cloneGitRepository(ctx context.Context, gitService portainer.GitService, cloneParams *cloneRepositoryParameters) error {
	username, password := "", ""
	if cloneParams.auth != nil {
		username = cloneParams.auth.username
		password = cloneParams.auth.password
	}

	return gitService.CloneRepository(
		ctx,
		cloneParams.toDir,
		cloneParams.url,
		cloneParams.ref,
		username,
		password,
		cloneParams.tlsSkipVerify,
	)
}
