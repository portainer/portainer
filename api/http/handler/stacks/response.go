package stacks

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/gitops/workflows"
)

// loadGitConfigForStack reads the merged GitConfig (Source URL/auth/TLS + Artifact ref/path/hash)
// and the SourceID for the given stack.
func loadGitConfigForStack(tx dataservices.DataStoreTx, workflowID portainer.WorkflowID, stackID portainer.StackID) (*gittypes.RepoConfig, portainer.SourceID, error) {
	src, file, err := workflows.GitSourceAndArtifactForStack(tx, workflowID, stackID)
	if err != nil || src == nil {
		return nil, 0, err
	}

	return workflows.MergeSourceAndFile(src, file), src.ID, nil
}

func saveStackGitConfig(tx dataservices.DataStoreTx, workflowID portainer.WorkflowID, stackID portainer.StackID, oldSourceID portainer.SourceID, cfg *gittypes.RepoConfig) error {
	return workflows.SaveWorkflowGitConfig(tx, workflowID, func(a portainer.Artifact) bool {
		return a.StackID == stackID
	}, oldSourceID, cfg)
}

// fillStackGitConfig populates stack.GitConfig from the merged Source+Artifact for backwards-compatible responses.
func fillStackGitConfig(tx dataservices.DataStoreTx, stack *portainer.Stack) error {
	if stack.WorkflowID == 0 {
		return nil
	}

	gitConfig, _, err := loadGitConfigForStack(tx, stack.WorkflowID, stack.ID)
	if err != nil {
		return err
	}

	stack.GitConfig = gittypes.SanitizeRepoConfig(gitConfig)

	return nil
}
