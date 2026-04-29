package workflows

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/internal/endpointutils"
	"github.com/portainer/portainer/api/internal/snapshot"
	"github.com/portainer/portainer/api/kubernetes/cli"
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

type endpointAccess struct {
	isKubeAdmin        bool
	nonAdminNamespaces []string
}

// filterDockerStacksByAccess filters stacks to only those the current user can access.
func filterDockerStacksByAccess(tx dataservices.DataStoreTx, stacks []portainer.Stack, sc *security.RestrictedRequestContext) ([]portainer.Stack, error) {
	if sc.IsAdmin {
		return stacks, nil
	}

	// do not try to check UAC on kube stacks
	filtered, dockerStacks := slicesx.Partition(stacks, func(s portainer.Stack) bool { return s.Type == portainer.KubernetesStack })

	stackResourceIDSet := set.ToSet(slicesx.Map(dockerStacks, func(s portainer.Stack) string {
		return stackutils.ResourceControlID(s.EndpointID, s.Name)
	}))

	resourceControls, err := tx.ResourceControl().ReadAll(func(rc portainer.ResourceControl) bool {
		return rc.Type == portainer.StackResourceControl && stackResourceIDSet[rc.ResourceID]
	})
	if err != nil {
		return nil, err
	}

	dockerStacks = authorization.DecorateStacks(dockerStacks, resourceControls)

	userTeamIDs := authorization.TeamIDs(sc.UserMemberships)
	filtered = append(filtered, authorization.FilterAuthorizedStacks(dockerStacks, sc.UserID, userTeamIDs)...)
	return filtered, nil
}

func resolveKubeAccess(k8sFactory *cli.ClientFactory, sc *security.RestrictedRequestContext, ep *portainer.Endpoint) (endpointAccess, error) {
	if sc.IsAdmin {
		return endpointAccess{isKubeAdmin: true}, nil
	}

	pcli, err := k8sFactory.GetPrivilegedKubeClient(ep)
	if err != nil {
		return endpointAccess{}, fmt.Errorf("unable to get privileged kube client for endpoint %d: %w", ep.ID, err)
	}

	teamIDs := make([]int, 0, len(sc.UserMemberships))
	for _, m := range sc.UserMemberships {
		teamIDs = append(teamIDs, int(m.TeamID))
	}

	nonAdminNamespaces, err := pcli.GetNonAdminNamespaces(int(sc.UserID), teamIDs, ep.Kubernetes.Configuration.RestrictDefaultNamespace)
	if err != nil {
		return endpointAccess{}, fmt.Errorf("unable to retrieve non-admin namespaces for endpoint %d: %w", ep.ID, err)
	}

	return endpointAccess{isKubeAdmin: false, nonAdminNamespaces: nonAdminNamespaces}, nil
}

func buildEndpointAccessMap(k8sFactory *cli.ClientFactory, sc *security.RestrictedRequestContext, endpointMap map[portainer.EndpointID]portainer.Endpoint) (map[portainer.EndpointID]endpointAccess, error) {
	result := make(map[portainer.EndpointID]endpointAccess, len(endpointMap))

	for epID, ep := range endpointMap {
		if !endpointutils.IsKubernetesEndpoint(&ep) {
			continue
		}

		access, err := resolveKubeAccess(k8sFactory, sc, &ep)
		if err != nil {
			return nil, err
		}

		result[epID] = access
	}

	return result, nil
}
