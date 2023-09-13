package update

import (
	"strings"

	"github.com/pkg/errors"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/git"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/rs/zerolog/log"
)

// UpdateGitObject updates a git object based on its config
func UpdateGitObject(gitService portainer.GitService, objId string, gitConfig *gittypes.RepoConfig, forceUpdate, enableVersionFolder bool, projectPath string) (bool, string, error) {
	if gitConfig == nil {
		return false, "", nil
	}

	log.Debug().
		Str("url", gitConfig.URL).
		Str("ref", gitConfig.ReferenceName).
		Str("object", objId).
		Msg("the object has a git config, try to poll from git repository")

	username, password, err := git.GetCredentials(gitConfig.Authentication)
	if err != nil {
		return false, "", errors.WithMessagef(err, "failed to get credentials for %v", objId)
	}

	newHash, err := gitService.LatestCommitID(gitConfig.URL, gitConfig.ReferenceName, username, password, gitConfig.TLSSkipVerify)
	if err != nil {
		return false, "", errors.WithMessagef(err, "failed to fetch latest commit id of %v", objId)
	}

	hashChanged := !strings.EqualFold(newHash, gitConfig.ConfigHash)

	if !hashChanged && !forceUpdate {
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

	if err := cloneGitRepository(gitService, cloneParams); err != nil {
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

func cloneGitRepository(gitService portainer.GitService, cloneParams *cloneRepositoryParameters) error {
	if cloneParams.auth != nil {
		return gitService.CloneRepository(cloneParams.toDir, cloneParams.url, cloneParams.ref, cloneParams.auth.username, cloneParams.auth.password, cloneParams.tlsSkipVerify)
	}

	return gitService.CloneRepository(cloneParams.toDir, cloneParams.url, cloneParams.ref, "", "", cloneParams.tlsSkipVerify)
}
