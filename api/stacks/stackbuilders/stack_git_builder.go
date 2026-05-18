package stackbuilders

import (
	"context"
	"fmt"
	"strconv"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/filesystem"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/scheduler"
	"github.com/portainer/portainer/api/stacks/deployments"
	"github.com/portainer/portainer/api/stacks/stackutils"
)

type GitMethodStackBuilder struct {
	StackBuilder
	gitService portainer.GitService
	scheduler  *scheduler.Scheduler
}

func (b *GitMethodStackBuilder) prepare(ctx context.Context, payload *StackPayload, userID portainer.UserID) error {
	b.stack.AdditionalFiles = payload.AdditionalFiles
	b.stack.AutoUpdate = payload.AutoUpdate

	if err := b.initCreatedBy(userID); err != nil {
		return err
	}

	var repoConfig gittypes.RepoConfig
	if payload.Authentication {
		repoConfig.Authentication = &gittypes.GitAuthentication{
			Username: payload.Username,
			Password: payload.Password,
		}
	}

	repoConfig.URL = payload.URL
	repoConfig.ReferenceName = payload.ReferenceName
	repoConfig.TLSSkipVerify = payload.TLSSkipVerify

	repoConfig.ConfigFilePath = payload.ComposeFile
	if payload.ComposeFile == "" {
		repoConfig.ConfigFilePath = filesystem.ComposeFileDefaultName
	}

	// If a manifest file is specified (for kube git apps), then use it instead of the default compose file name
	if payload.ManifestFile != "" {
		repoConfig.ConfigFilePath = payload.ManifestFile
	}

	stackFolder := strconv.Itoa(int(b.stack.ID))
	// Set the project path on the disk
	b.stack.ProjectPath = b.fileService.GetStackProjectPath(stackFolder)

	getProjectPath := func() string {
		stackFolder := fmt.Sprintf("%d", b.stack.ID)
		return b.fileService.GetStackProjectPath(stackFolder)
	}

	commitHash, err := stackutils.DownloadGitRepository(ctx, repoConfig, b.gitService, getProjectPath)
	if err != nil {
		return fmt.Errorf("failed to download git repository: %w", err)
	}

	// Update the latest commit id
	repoConfig.ConfigHash = commitHash
	b.stack.GitConfig = &repoConfig

	return nil
}

// postDeploy enables the auto-update scheduler job for the stack if configured,
// and persists the resulting job ID back to the database.
func (b *GitMethodStackBuilder) postDeploy(ctx context.Context, stack *portainer.Stack) error {
	if stack.AutoUpdate == nil || stack.AutoUpdate.Interval == "" {
		return nil
	}

	jobID, err := deployments.StartAutoupdate(ctx, stack.ID,
		stack.AutoUpdate.Interval,
		b.scheduler,
		b.stackDeployer,
		b.dataStore,
		b.gitService)
	if err != nil {
		return err
	}

	return b.dataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		s, err := tx.Stack().Read(stack.ID)
		if err != nil {
			return fmt.Errorf("Unable to retrieve the stack from the database: %w", err)
		}

		s.AutoUpdate.JobID = jobID

		if err := tx.Stack().Update(s.ID, s); err != nil {
			return fmt.Errorf("Unable to update the stack inside the database: %w", err)
		}

		return nil
	})
}
