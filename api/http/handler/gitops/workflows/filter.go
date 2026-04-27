package workflows

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/internal/endpointutils"
	"github.com/portainer/portainer/api/internal/snapshot"
	"github.com/portainer/portainer/api/set"
	"github.com/portainer/portainer/api/slicesx"
	"github.com/portainer/portainer/api/stacks/stackutils"
)

func endpointMatchesStackType(ep portainer.Endpoint, stackType portainer.StackType) bool {
	switch stackType {
	case portainer.DockerSwarmStack:
		return len(ep.Snapshots) > 0 && ep.Snapshots[0].Swarm
	case portainer.DockerComposeStack:
		return len(ep.Snapshots) == 0 || !ep.Snapshots[0].Swarm
	case portainer.KubernetesStack:
		return endpointutils.IsKubernetesEndpoint(&ep)
	default:
		return true
	}
}

func buildEndpointMap(tx dataservices.DataStoreTx, stacks []portainer.Stack) (map[portainer.EndpointID]portainer.Endpoint, error) {
	ids := set.ToSet(slicesx.Map(stacks, func(s portainer.Stack) portainer.EndpointID { return s.EndpointID }))

	endpoints, err := tx.Endpoint().ReadAll(func(ep portainer.Endpoint) bool { return ids[ep.ID] })
	if err != nil {
		return nil, err
	}

	m := make(map[portainer.EndpointID]portainer.Endpoint, len(endpoints))
	for i := range endpoints {
		if err := snapshot.FillSnapshotData(tx, &endpoints[i], false); err != nil {
			return nil, fmt.Errorf("unable to fill snapshot data for endpoint %d: %w", endpoints[i].ID, err)
		}
		m[endpoints[i].ID] = endpoints[i]
	}

	return m, nil
}

func filterStacksByAccess(tx dataservices.DataStoreTx, stacks []portainer.Stack, sc *security.RestrictedRequestContext) ([]portainer.Stack, error) {
	if sc.IsAdmin {
		return stacks, nil
	}

	stackResourceIDSet := set.ToSet(slicesx.Map(stacks, func(s portainer.Stack) string {
		return stackutils.ResourceControlID(s.EndpointID, s.Name)
	}))

	resourceControls, err := tx.ResourceControl().ReadAll(func(rc portainer.ResourceControl) bool {
		return rc.Type == portainer.StackResourceControl && stackResourceIDSet[rc.ResourceID]
	})
	if err != nil {
		return nil, err
	}

	stacks = authorization.DecorateStacks(stacks, resourceControls)

	userTeamIDs := authorization.TeamIDs(sc.UserMemberships)
	return authorization.FilterAuthorizedStacks(stacks, sc.UserID, userTeamIDs), nil
}
