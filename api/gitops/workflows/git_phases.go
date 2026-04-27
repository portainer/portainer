package workflows

import (
	"context"
	"fmt"
	"path"
	"slices"
)

// ListRefsFunc lists all git refs for a repository.
type ListRefsFunc func(ctx context.Context) ([]string, error)

// ListFilesFunc lists files in a repository branch filtered by extension.
type ListFilesFunc func(ctx context.Context, exts []string) ([]string, error)

// ComputeGitPhases checks source (ref reachability) and artifact (config file presence).
// If source fails, artifact is returned as unknown without making a network call.
func ComputeGitPhases(ctx context.Context, referenceName, configFilePath string, listRefs ListRefsFunc, listFiles ListFilesFunc) (source, artifact WorkflowPhaseStatus) {
	source = computeSourcePhase(ctx, referenceName, listRefs)
	if source.Status == StatusError {
		return source, WorkflowPhaseStatus{Status: StatusUnknown}
	}
	return source, computeArtifactPhase(ctx, configFilePath, listFiles)
}

func computeSourcePhase(ctx context.Context, referenceName string, listRefs ListRefsFunc) WorkflowPhaseStatus {
	refs, err := listRefs(ctx)
	if err != nil {
		return WorkflowPhaseStatus{Status: StatusError, Error: err.Error()}
	}
	if referenceName == "" {
		return WorkflowPhaseStatus{Status: StatusHealthy}
	}
	if !slices.Contains(refs, referenceName) {
		return WorkflowPhaseStatus{Status: StatusError, Error: fmt.Sprintf("ref %q not found", referenceName)}
	}
	return WorkflowPhaseStatus{Status: StatusHealthy}
}

func computeArtifactPhase(ctx context.Context, configFilePath string, listFiles ListFilesFunc) WorkflowPhaseStatus {
	if configFilePath == "" {
		return WorkflowPhaseStatus{Status: StatusError, Error: "no config file path specified"}
	}
	ext := path.Ext(configFilePath)
	var exts []string
	if len(ext) > 0 {
		ext = ext[1:]
		exts = []string{ext}
	}

	files, err := listFiles(ctx, exts)
	if err != nil {
		return WorkflowPhaseStatus{Status: StatusError, Error: err.Error()}
	}
	if !slices.Contains(files, configFilePath) {
		return WorkflowPhaseStatus{Status: StatusError, Error: fmt.Sprintf("file %q not found", configFilePath)}
	}
	return WorkflowPhaseStatus{Status: StatusHealthy}
}
