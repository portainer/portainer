package workflows

import (
	"context"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/kubernetes/cli"
	"github.com/portainer/portainer/api/set"
)

// FetchWorkflows returns all GitOps workflows visible to the given user.
func FetchWorkflows(
	ctx context.Context,
	dataStore dataservices.DataStore,
	gitService portainer.GitService,
	k8sFactory *cli.ClientFactory,
	sc *security.RestrictedRequestContext,
	endpointIDSet set.Set[portainer.EndpointID],
) ([]Workflow, error) {
	var entries []portainer.Stack
	var endpointMap map[portainer.EndpointID]portainer.Endpoint

	err := dataStore.ViewTx(func(tx dataservices.DataStoreTx) error {
		stacks, err := tx.Stack().ReadAll(func(s portainer.Stack) bool {
			return s.GitConfig != nil && (len(endpointIDSet) == 0 || endpointIDSet.Contains(s.EndpointID))
		})
		if err != nil {
			return err
		}

		endpointMap, err = buildEndpointMap(tx, stacks)
		if err != nil {
			return err
		}

		stacks, err = filterDockerStacksByAccess(tx, stacks, sc)
		if err != nil {
			return err
		}

		for i := range stacks {
			s := stacks[i]

			if ep, ok := endpointMap[s.EndpointID]; ok && !EndpointMatchesStackType(ep, s.Type) {
				continue
			}
			entries = append(entries, s)
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	accessMap, err := buildEndpointAccessMap(k8sFactory, sc, endpointMap)
	if err != nil {
		return nil, err
	}

	entries, err = filterK8SStacks(entries, endpointMap, k8sFactory, accessMap)
	if err != nil {
		return nil, err
	}

	items := make([]Workflow, 0, len(entries))
	for _, s := range entries {
		source, artifact := computePhases(ctx, gitService, s.GitConfig)
		items = append(items, MapStackToWorkflow(s, s.GitConfig, source, artifact))
	}

	return items, nil
}

func computePhases(ctx context.Context, gitSvc portainer.GitService, cfg *gittypes.RepoConfig) (source, artifact WorkflowPhaseStatus) {
	if gitSvc == nil || cfg == nil {
		return WorkflowPhaseStatus{Status: StatusUnknown}, WorkflowPhaseStatus{Status: StatusUnknown}
	}

	username, password := gitCredentials(cfg)
	return ComputeGitPhases(ctx, cfg.ReferenceName, cfg.ConfigFilePath,
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
