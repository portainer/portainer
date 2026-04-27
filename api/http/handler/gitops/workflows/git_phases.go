package workflows

import (
	"context"

	portainer "github.com/portainer/portainer/api"
	gittypes "github.com/portainer/portainer/api/git/types"
	wf "github.com/portainer/portainer/api/gitops/workflows"
)

func computeGitPhases(ctx context.Context, gitSvc portainer.GitService, cfg *gittypes.RepoConfig) (source, artifact wf.WorkflowPhaseStatus) {
	if gitSvc == nil || cfg == nil {
		return wf.WorkflowPhaseStatus{Status: wf.StatusUnknown}, wf.WorkflowPhaseStatus{Status: wf.StatusUnknown}
	}

	username, password := gitCredentials(cfg)
	return wf.ComputeGitPhases(ctx, cfg.ReferenceName, cfg.ConfigFilePath,
		func(ctx context.Context) ([]string, error) {
			return gitSvc.ListRefs(ctx, cfg.URL, username, password, false, cfg.TLSSkipVerify)
		},
		func(ctx context.Context, exts []string) ([]string, error) {
			return gitSvc.ListFiles(ctx, cfg.URL, cfg.ReferenceName, username, password, false, false, exts, cfg.TLSSkipVerify)
		},
	)
}

func gitCredentials(cfg *gittypes.RepoConfig) (username, password string) {
	if cfg.Authentication != nil {
		return cfg.Authentication.Username, cfg.Authentication.Password
	}
	return "", ""
}
