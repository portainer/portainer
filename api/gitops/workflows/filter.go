package workflows

import (
	"cmp"
	"fmt"
	"slices"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/internal/endpointutils"
	"github.com/portainer/portainer/api/internal/snapshot"
	"github.com/portainer/portainer/api/kubernetes/cli"
	"github.com/portainer/portainer/api/set"
	"github.com/portainer/portainer/api/slicesx"
	"github.com/portainer/portainer/api/stacks/stackutils"
	"github.com/portainer/portainer/pkg/libkubectl"

	"github.com/rs/zerolog/log"
)

// HasAccessibleSource reports whether any of the artifact's files has a source visible in
// sourceMap.
func HasAccessibleSource(files []portainer.ArtifactFile, sourceMap map[portainer.SourceID]portainer.Source) bool {
	return slicesx.Some(files, func(f portainer.ArtifactFile) bool {
		_, ok := sourceMap[f.SourceID]
		return ok
	})
}

// ArtifactBackingExists reports whether the artifact's target stack or edge stack still exists,
// using the caller-supplied existence checks. An artifact with neither StackID nor EdgeStackID set
// has no backing target.
//
// The check is expressed as caller-supplied closures rather than a shared store interface because
// CE and EE each define their own Stack/EdgeStack service and domain types (portainer.Stack vs
// portaineree.Stack), so a single interface type cannot be satisfied by both editions' DataStoreTx.
func ArtifactBackingExists(a portainer.Artifact, stackExists func(portainer.StackID) (bool, error), edgeStackExists func(portainer.EdgeStackID) (bool, error)) (bool, error) {
	switch {
	case a.StackID != 0:
		return stackExists(a.StackID)
	case a.EdgeStackID != 0:
		return edgeStackExists(a.EdgeStackID)
	default:
		return false, nil
	}
}

// EndpointMatchesStackType reports whether ep is a valid target for stackType.
func EndpointMatchesStackType(ep portainer.Endpoint, stackType portainer.StackType) bool {
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

// BuildEndpointMap reads and returns the endpoints backing stacks, keyed by endpoint ID, with
// snapshot data filled in.
func BuildEndpointMap(tx dataservices.DataStoreTx, stacks []portainer.Stack) (map[portainer.EndpointID]portainer.Endpoint, error) {
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

// FilterDockerStacksByAccess filters stacks to only those the current user can access.
func FilterDockerStacksByAccess(tx dataservices.DataStoreTx, stacks []portainer.Stack, sc *security.RestrictedRequestContext) ([]portainer.Stack, error) {
	if sc.IsAdmin {
		return stacks, nil
	}

	// do not try to check UAC on kube stacks
	filtered, dockerStacks := slicesx.Partition(stacks, func(s portainer.Stack) bool { return s.Type == portainer.KubernetesStack })
	if len(dockerStacks) == 0 {
		return filtered, nil
	}

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

	endpointIDSet := set.ToSet(slicesx.Map(dockerStacks, func(s portainer.Stack) portainer.EndpointID { return s.EndpointID }))
	endpoints, err := tx.Endpoint().ReadAll(func(ep portainer.Endpoint) bool { return endpointIDSet[ep.ID] })
	if err != nil {
		return nil, err
	}

	endpointGroups, err := tx.EndpointGroup().ReadAll()
	if err != nil {
		return nil, err
	}

	accessibleEndpointIDs := security.AccessibleEndpointIDs(endpoints, endpointGroups, sc)
	userTeamIDs := authorization.TeamIDs(sc.UserMemberships)
	filtered = append(filtered, authorization.FilterAuthorizedStacks(dockerStacks, sc.UserID, userTeamIDs, accessibleEndpointIDs)...)
	return filtered, nil
}

// ReadEndpointGroup returns the environment group or nil when it doesn't exist.
func ReadEndpointGroup(tx dataservices.DataStoreTx, id portainer.EndpointGroupID) (*portainer.EndpointGroup, error) {
	group, err := tx.EndpointGroup().Read(id)
	if tx.IsErrObjectNotFound(err) {
		return nil, nil
	}

	return group, err
}

// ResolveKubeAccess determines sc's Kubernetes admin/namespace access on ep.
func ResolveKubeAccess(
	k8sFactory *cli.ClientFactory,
	sc *security.RestrictedRequestContext,
	ep *portainer.Endpoint,
	group *portainer.EndpointGroup,
) (endpointAccess, error) {
	if sc.IsAdmin {
		return endpointAccess{IsKubeAdmin: true}, nil
	}

	// A missing group or a user without access to the environment gets no namespaces, not even the default one.
	if group == nil || !security.AuthorizedEndpointAccess(ep, group, sc.UserID, sc.UserMemberships) {
		return endpointAccess{}, nil
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

	return endpointAccess{IsKubeAdmin: false, NonAdminNamespaces: nonAdminNamespaces}, nil
}

type endpointAccess struct {
	IsKubeAdmin        bool
	NonAdminNamespaces []string
}

// buildEndpointAccessMap resolves sc's Kubernetes access for every Kubernetes endpoint in
// endpointMap, skipping (and logging) any endpoint whose access cannot be resolved.
func buildEndpointAccessMap(tx dataservices.DataStoreTx, k8sFactory *cli.ClientFactory, sc *security.RestrictedRequestContext, endpointMap map[portainer.EndpointID]portainer.Endpoint) (map[portainer.EndpointID]endpointAccess, error) {
	groups, err := tx.EndpointGroup().ReadAll()
	if err != nil {
		return nil, fmt.Errorf("unable to retrieve environment groups: %w", err)
	}

	groupByID := make(map[portainer.EndpointGroupID]*portainer.EndpointGroup, len(groups))
	for i := range groups {
		groupByID[groups[i].ID] = &groups[i]
	}

	result := make(map[portainer.EndpointID]endpointAccess, len(endpointMap))

	for epID, ep := range endpointMap {
		if !endpointutils.IsKubernetesEndpoint(&ep) {
			continue
		}

		access, err := ResolveKubeAccess(k8sFactory, sc, &ep, groupByID[ep.GroupID])
		if err != nil {
			log.Warn().Err(err).Str("context", "buildEndpointAccessMap").Int("endpoint_id", int(epID)).Msg("Failed to resolve kube access for endpoint, skipping")
			continue
		}

		result[epID] = access
	}

	return result, nil
}

// AuthorizeKubeStackRead reports whether sc may read the Kubernetes stack as deployed: a kube admin,
// or granted every namespace the stack deploys into.
func AuthorizeKubeStackRead(
	tx dataservices.DataStoreTx,
	k8sFactory *cli.ClientFactory,
	sc *security.RestrictedRequestContext,
	endpoint *portainer.Endpoint,
	stack *portainer.Stack,
) (bool, error) {
	group, err := ReadEndpointGroup(tx, endpoint.GroupID)
	if err != nil {
		return false, err
	}

	access, err := ResolveKubeAccess(k8sFactory, sc, endpoint, group)
	if err != nil {
		return false, err
	}

	return CanReadKubeStack(access, stack)
}

// CanReadKubeStack reports whether access covers every namespace the stack deploys into.
func CanReadKubeStack(access endpointAccess, stack *portainer.Stack) (bool, error) {
	if access.IsKubeAdmin {
		return true, nil
	}

	namespaces, err := StackNamespaces(stack, DeployedManifestPaths(stack))
	if err != nil {
		return false, err
	}

	return len(namespaces) > 0 && !slices.ContainsFunc(namespaces, func(namespace string) bool {
		return !slices.Contains(access.NonAdminNamespaces, namespace)
	}), nil
}

// DeployedManifestPaths returns the manifest paths of the revision the stack is deployed from.
// Saving git settings changes the entry point before the stack is redeployed, so the deployed file
// takes precedence over the configured one.
func DeployedManifestPaths(stack *portainer.Stack) []string {
	entryPoint := stack.EntryPoint
	if deployment := stack.CurrentDeploymentInfo; deployment != nil {
		entryPoint = cmp.Or(deployment.ConfigFilePath, entryPoint)
	}

	paths := make([]string, 0, 1+len(stack.AdditionalFiles))
	for _, file := range append([]string{entryPoint}, stack.AdditionalFiles...) {
		paths = append(paths, filesystem.JoinPaths(stack.ProjectPath, file))
	}

	return paths
}

// StackNamespaces returns the distinct namespaces the stack deploys into, resolved the way the
// deployer resolves them: the stored namespace, or each object's own namespace when none is stored.
// A Namespace object counts as the namespace it creates. It returns none when the stack also
// deploys any other cluster-scoped object, which only kube admins may read. Scope comes from the
// deployer's schema, so a namespace declared on a cluster-scoped object is ignored and an unknown
// kind counts as namespaced.
func StackNamespaces(stack *portainer.Stack, manifestPaths []string) ([]string, error) {
	objects, err := libkubectl.PrepareObjects(manifestPaths, stack.Namespace)
	if err != nil {
		return nil, fmt.Errorf("unable to read the stack manifests: %w", err)
	}

	namespaces := make([]string, 0, len(objects))
	for _, object := range objects {
		switch {
		case object.GetAPIVersion() == "v1" && object.GetKind() == "Namespace":
			namespaces = append(namespaces, object.GetName())
		case libkubectl.IsClusterScoped(object):
			return nil, nil
		default:
			namespaces = append(namespaces, object.GetNamespace())
		}
	}

	slices.Sort(namespaces)

	return slices.Compact(namespaces), nil
}

func isK8SNamespaceAccessible(stack portainer.Stack, accessMap map[portainer.EndpointID]endpointAccess) bool {
	if stack.Type != portainer.KubernetesStack {
		return true
	}

	allowed, err := CanReadKubeStack(accessMap[stack.EndpointID], &stack)
	if err != nil {
		log.Warn().Err(err).Str("context", "isK8SNamespaceAccessible").Int("stack_id", int(stack.ID)).Msg("Failed to resolve stack namespaces, filtering stack")
		return false
	}

	return allowed
}

// filterK8SStacks drops Kubernetes stacks the user may not read, checking every namespace their
// manifests deploy into. Docker stacks pass through unchanged.
func filterK8SStacks(items []portainer.Stack, accessMap map[portainer.EndpointID]endpointAccess) []portainer.Stack {
	return slicesx.Filter(items, func(s portainer.Stack) bool {
		return isK8SNamespaceAccessible(s, accessMap)
	})
}
