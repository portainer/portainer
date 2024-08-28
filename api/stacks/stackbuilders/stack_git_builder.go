package stackbuilders

import (
	"fmt"
	"strconv"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/filesystem"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/scheduler"
	"github.com/portainer/portainer/api/stacks/deployments"
	"github.com/portainer/portainer/api/stacks/stackutils"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
)

type GitMethodStackBuildProcess interface {
	// Set general stack information
	SetGeneralInfo(payload *StackPayload, endpoint *portainer.Endpoint) GitMethodStackBuildProcess
	// Set unique stack information, e.g. swarm stack has swarmID, kubernetes stack has namespace
	SetUniqueInfo(payload *StackPayload) GitMethodStackBuildProcess
	// Deploy stack based on the configuration
	Deploy(payload *StackPayload, endpoint *portainer.Endpoint) GitMethodStackBuildProcess
	// Save the stack information to database and return the stack object
	SaveStack() (*portainer.Stack, *httperror.HandlerError)
	// Get response from HTTP request. Use if it is needed
	GetResponse() string
	// Set git repository configuration
	SetGitRepository(payload *StackPayload) GitMethodStackBuildProcess
	// Set auto update setting
	SetAutoUpdate(payload *StackPayload) GitMethodStackBuildProcess
}

type GitMethodStackBuilder struct {
	StackBuilder
	gitService portainer.GitService
	scheduler  *scheduler.Scheduler
}

func (b *GitMethodStackBuilder) SetGeneralInfo(payload *StackPayload, endpoint *portainer.Endpoint) GitMethodStackBuildProcess {
	stackID := b.dataStore.Stack().GetNextIdentifier()
	b.stack.ID = portainer.StackID(stackID)
	b.stack.EndpointID = endpoint.ID
	b.stack.AdditionalFiles = payload.AdditionalFiles
	b.stack.Status = portainer.StackStatusActive
	b.stack.CreationDate = time.Now().Unix()
	b.stack.AutoUpdate = payload.AutoUpdate

	return b
}

func (b *GitMethodStackBuilder) SetUniqueInfo(payload *StackPayload) GitMethodStackBuildProcess {
	return b
}

func (b *GitMethodStackBuilder) SetGitRepository(payload *StackPayload) GitMethodStackBuildProcess {
	if b.hasError() {
		return b
	}

	var repoConfig gittypes.RepoConfig
	if payload.Authentication {
		repoConfig.Authentication = &gittypes.GitAuthentication{
			Username: payload.RepositoryConfigPayload.Username,
			Password: payload.RepositoryConfigPayload.Password,
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

	commitHash, err := stackutils.DownloadGitRepository(repoConfig, b.gitService, getProjectPath)
	if err != nil {
		b.err = httperror.InternalServerError(err.Error(), err)
		return b
	}

	// Update the latest commit id
	repoConfig.ConfigHash = commitHash
	b.stack.GitConfig = &repoConfig

	return b
}

func (b *GitMethodStackBuilder) Deploy(payload *StackPayload, endpoint *portainer.Endpoint) GitMethodStackBuildProcess {
	if b.hasError() {
		return b
	}

	// Deploy the stack
	err := b.deploymentConfiger.Deploy()
	if err != nil {
		b.err = httperror.InternalServerError(err.Error(), err)
		return b
	}

	return b
}

func (b *GitMethodStackBuilder) SetAutoUpdate(payload *StackPayload) GitMethodStackBuildProcess {
	if b.hasError() {
		return b
	}

	if payload.AutoUpdate != nil && payload.AutoUpdate.Interval != "" {
		jobID, err := deployments.StartAutoupdate(b.stack.ID,
			b.stack.AutoUpdate.Interval,
			b.scheduler,
			b.stackDeployer,
			b.dataStore,
			b.gitService)
		if err != nil {
			b.err = err
			return b
		}

		b.stack.AutoUpdate.JobID = jobID
	}

	return b
}

func (b *GitMethodStackBuilder) GetResponse() string {
	return ""
}
