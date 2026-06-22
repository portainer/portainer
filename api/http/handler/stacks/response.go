package stacks

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/gitops/workflows"
)

// stackResponse extends a Stack response with the git source identifier.
type stackResponse struct {
	portainer.Stack
	GitSourceId portainer.SourceID `json:"GitSourceId,omitempty"`
}

// loadGitConfigForStack reads the merged GitConfig (Source URL/auth/TLS + Artifact ref/path/hash)
// and the SourceID for the given stack.
func loadGitConfigForStack(tx dataservices.DataStoreTx, userContext *dataservices.SourceServiceUserContext, workflowID portainer.WorkflowID, stackID portainer.StackID) (*gittypes.RepoConfig, portainer.SourceID, error) {
	src, file, err := workflows.GitSourceAndArtifactForStack(tx, userContext, workflowID, stackID)
	if err != nil || src == nil {
		return nil, 0, err
	}

	return workflows.MergeSourceAndFile(src, file), src.ID, nil
}

// saveStackGitConfig persists the stack's git settings. When newSourceID is non-zero the stack's
// artifact is repointed to that existing Source (selected by the caller) without modifying any
// Source's git config; otherwise the target Source is derived from cfg.URL.
func saveStackGitConfig(tx dataservices.DataStoreTx, userContext *dataservices.SourceServiceUserContext, workflowID portainer.WorkflowID, stackID portainer.StackID, oldSourceID, newSourceID portainer.SourceID, cfg *gittypes.RepoConfig) error {
	matchArtifact := func(a portainer.Artifact) bool {
		return a.StackID == stackID
	}

	if newSourceID != 0 {
		return workflows.SaveWorkflowArtifact(tx, workflowID, matchArtifact, oldSourceID, portainer.ArtifactFile{
			SourceID: newSourceID,
			Ref:      cfg.ReferenceName,
			Path:     cfg.ConfigFilePath,
			Hash:     cfg.ConfigHash,
		})
	}

	return workflows.SaveWorkflowGitConfig(tx, userContext, workflowID, matchArtifact, oldSourceID, cfg)
}

// newStackResponse fills stack.GitConfig and returns a response that also includes GitSourceId.
func newStackResponse(tx dataservices.DataStoreTx, userContext *dataservices.SourceServiceUserContext, stack *portainer.Stack) (*stackResponse, error) {
	if stack.WorkflowID == 0 {
		return &stackResponse{Stack: *stack}, nil
	}

	gitConfig, gitSourceID, err := loadGitConfigForStack(tx, userContext, stack.WorkflowID, stack.ID)
	if err != nil {
		return nil, err
	}

	stack.GitConfig = gittypes.SanitizeRepoConfig(gitConfig)

	return &stackResponse{Stack: *stack, GitSourceId: gitSourceID}, nil
}

// fillStackGitConfig populates stack.GitConfig from the merged Source+Artifact for backwards-compatible responses.
func fillStackGitConfig(tx dataservices.DataStoreTx, userContext *dataservices.SourceServiceUserContext, stack *portainer.Stack) error {
	if stack.WorkflowID == 0 {
		return nil
	}

	gitConfig, _, err := loadGitConfigForStack(tx, userContext, stack.WorkflowID, stack.ID)
	if err != nil {
		return err
	}

	stack.GitConfig = gittypes.SanitizeRepoConfig(gitConfig)

	return nil
}
