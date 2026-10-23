package stackbuilders

import (
	"context"
	"fmt"
	"strconv"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/dataservices/source"
	"github.com/portainer/portainer/api/filesystem"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/gitops/scheduling"
	"github.com/portainer/portainer/api/gitops/workflows"
	"github.com/portainer/portainer/api/stacks/stackutils"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/ssrf"
)

type GitMethodStackBuilder struct {
	StackBuilder
	gitService       portainer.GitService
	sourceScheduler  *scheduling.SourceScheduler
	resolvedSourceID portainer.SourceID
}

func (b *GitMethodStackBuilder) prepare(ctx context.Context, payload *StackPayload, userID portainer.UserID) error {
	b.stack.AdditionalFiles = payload.AdditionalFiles
	b.stack.AutoUpdate = payload.AutoUpdate

	if err := b.initCreatedBy(userID); err != nil {
		return err
	}

	var userContext source.UserContext
	if err := b.dataStore.ViewTx(func(tx dataservices.DataStoreTx) error {
		user, err := tx.User().Read(userID)
		if err != nil {
			return httperror.InternalServerError("Unable to read user", err)
		}
		memberships, err := tx.TeamMembership().TeamMembershipsByUserID(userID)
		if err != nil {
			return httperror.InternalServerError("Unable to read user team memberships", err)
		}

		userContext = source.NewUserContext(user, memberships)
		return nil
	}); err != nil {
		return err
	}

	var repoConfig gittypes.RepoConfig
	var sourceID portainer.SourceID

	if payload.SourceID != 0 {
		src, err := b.dataStore.Source().Read(userContext, payload.SourceID)
		if err != nil {
			return fmt.Errorf("failed to read source: %w", err)
		}
		if src.Git == nil {
			return fmt.Errorf("source %d has no git configuration", payload.SourceID)
		}

		repoConfig.URL = src.Git.URL
		repoConfig.Authentication = src.Git.Authentication
		repoConfig.TLSSkipVerify = src.Git.TLSSkipVerify
		repoConfig.ReferenceName = payload.ReferenceName
		sourceID = src.ID
	} else {
		if payload.Authentication {
			repoConfig.Authentication = &gittypes.GitAuthentication{
				Username: payload.Username,
				Password: payload.Password,
			}
		}

		repoConfig.URL = payload.URL
		repoConfig.ReferenceName = payload.ReferenceName
		repoConfig.TLSSkipVerify = payload.TLSSkipVerify
	}

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

	if err := ssrf.CheckURL(ctx, repoConfig.URL); err != nil {
		return fmt.Errorf("repository URL blocked by SSRF policy: %w", err)
	}

	commitHash, err := stackutils.DownloadGitRepository(ctx, repoConfig, b.gitService, getProjectPath)
	if err != nil {
		if txErr := b.dataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
			return workflows.SaveSourceStatus(tx, userContext, sourceID, err)
		}); txErr != nil {
			return fmt.Errorf("failed to download git repository: %w (and failed to persist status: %w)", err, txErr)
		}

		return fmt.Errorf("failed to download git repository: %w", err)
	}

	// Update the latest commit id
	repoConfig.ConfigHash = commitHash

	var workflowID portainer.WorkflowID

	if err := b.dataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		file := portainer.ArtifactFile{
			Path:       repoConfig.ConfigFilePath,
			Ref:        repoConfig.ReferenceName,
			Hash:       repoConfig.ConfigHash,
			RefStatus:  portainer.SourceStatusHealthy,
			PathStatus: portainer.SourceStatusHealthy,
		}

		var resolvedSrc *portainer.Source

		if sourceID != 0 {
			s, err := tx.Source().Read(userContext, sourceID)
			if err != nil {
				return fmt.Errorf("failed to read source: %w", err)
			}

			file.SourceID = s.ID
			resolvedSrc = s
		} else {
			repoConfig.URL = gittypes.SanitizeURL(repoConfig.URL)

			src, err := workflows.FindOrCreateGitSource(tx, userContext, &portainer.Source{
				Name: gittypes.RepoName(repoConfig.URL),
				Type: portainer.SourceTypeGit,
				Git: &gittypes.GitSource{
					URL:            repoConfig.URL,
					Authentication: repoConfig.Authentication,
					TLSSkipVerify:  repoConfig.TLSSkipVerify,
				},
			})
			if err != nil {
				return fmt.Errorf("failed to find or create source: %w", err)
			}

			file.SourceID = src.ID
			resolvedSrc = src
		}

		if err := workflows.SaveSourceStatus(tx, userContext, file.SourceID, nil); err != nil {
			return fmt.Errorf("failed to persist source sync status: %w", err)
		}

		wf := &portainer.Workflow{
			Name: b.stack.Name,
			Artifacts: []portainer.Artifact{{
				StackID: b.stack.ID,
				Files:   []portainer.ArtifactFile{file},
			}},
		}
		if err := tx.Workflow().Create(wf); err != nil {
			return fmt.Errorf("failed to create workflow: %w", err)
		}

		workflowID = wf.ID
		b.resolvedSourceID = resolvedSrc.ID

		return nil
	}); err != nil {
		return err
	}

	b.stack.WorkflowID = workflowID

	return nil
}

func (b *GitMethodStackBuilder) postDeploy(_ context.Context, _ *portainer.Stack) error {
	return b.sourceScheduler.Reconcile(b.resolvedSourceID)
}
