package stacks

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/dataservices/source"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/gitops/workflows"
	"github.com/portainer/portainer/api/http/security"
)

// stackResponse extends a Stack response with the git source identifier.
type stackResponse struct {
	portainer.Stack
	GitSourceId portainer.SourceID `json:"GitSourceId,omitempty"`
}

// loadGitConfigForStack reads the merged GitConfig (Source URL/auth/TLS + Artifact ref/path/hash)
// and the SourceID for the given stack.
func loadGitConfigForStack(tx dataservices.DataStoreTx, userContext source.UserContext, workflowID portainer.WorkflowID, stackID portainer.StackID) (*gittypes.RepoConfig, portainer.SourceID, error) {
	src, file, err := workflows.GitSourceAndArtifactForStack(tx, userContext, workflowID, stackID)
	if err != nil || src == nil {
		return nil, 0, err
	}

	return workflows.MergeSourceAndFile(src, file), src.ID, nil
}

// saveStackGitConfig persists the stack's git settings. When newSourceID is non-zero the stack's
// artifact is repointed to that existing Source (selected by the caller) without modifying any
// Source's git config; otherwise the target Source is derived from cfg.URL.
func saveStackGitConfig(tx dataservices.DataStoreTx, userContext source.UserContext, workflowID portainer.WorkflowID, stackID portainer.StackID, oldSourceID, newSourceID portainer.SourceID, cfg *gittypes.RepoConfig) error {
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

func persistSourceSyncError(tx dataservices.DataStoreTx, securityContext *security.RestrictedRequestContext, sourceID portainer.SourceID, syncErr error) error {
	userContext := source.NewUserContext(securityContext.User, securityContext.UserMemberships)

	return workflows.SaveSourceStatus(tx, userContext, sourceID, syncErr)
}

// newStackResponse fills stack.GitConfig and returns a response that also includes GitSourceId.
func newStackResponse(tx dataservices.DataStoreTx, userContext source.UserContext, stack *portainer.Stack) (*stackResponse, error) {
	if stack.WorkflowID == 0 {
		return &stackResponse{Stack: *stack}, nil
	}

	gitConfig, gitSourceID, err := loadGitConfigForStack(tx, userContext, stack.WorkflowID, stack.ID)
	if err != nil {
		return nil, err
	}

	stack.GitConfig = gittypes.SanitizeRepoConfig(gitConfig)
	fillAutoUpdateInterval(tx, userContext, stack)

	return &stackResponse{Stack: *stack, GitSourceId: gitSourceID}, nil
}

// fillStackGitConfig populates stack.GitConfig from the merged Source+Artifact for backwards-compatible responses.
func fillStackGitConfig(tx dataservices.DataStoreTx, userContext source.UserContext, stack *portainer.Stack) error {
	if stack.WorkflowID == 0 {
		return nil
	}

	gitConfig, _, err := loadGitConfigForStack(tx, userContext, stack.WorkflowID, stack.ID)
	if err != nil {
		return err
	}

	stack.GitConfig = gittypes.SanitizeRepoConfig(gitConfig)
	fillAutoUpdateInterval(tx, userContext, stack)

	return nil
}

// fillAutoUpdateInterval restores the deprecated AutoUpdate.Interval field on API responses
// from the linked Source, so old API clients keep seeing polling intervals set through the GitOps
// Sources UI.
func fillAutoUpdateInterval(tx dataservices.DataStoreTx, userContext source.UserContext, stack *portainer.Stack) {
	src, _, err := workflows.GitSourceAndArtifactForStack(tx, userContext, stack.WorkflowID, stack.ID)
	if err != nil || src == nil || src.Interval == "" {
		return
	}

	if stack.AutoUpdate == nil {
		stack.AutoUpdate = &portainer.AutoUpdateSettings{}
	}

	stack.AutoUpdate.Interval = src.Interval
}
