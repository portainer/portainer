package workflows

import (
	"errors"
	"fmt"
	"slices"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/dataservices/source"
	svc "github.com/portainer/portainer/api/gitops/workflows"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/kubernetes/cli"
	"github.com/portainer/portainer/api/set"

	"github.com/rs/zerolog/log"
)

// ErrNotFound indicates a workflow or one of its artifacts is not visible to the requesting user,
// either because it does not exist or because access has been filtered out.
var ErrNotFound = errors.New("not found")

// ErrResourceNotAccessible indicates sc cannot access a resource that does exist. Callers
// resolving a single artifact translate this to ErrNotFound to avoid leaking its existence.
var ErrResourceNotAccessible = errors.New("resource not accessible")

// fetchWorkflowByID returns the detail view of a single workflow, resolving each of its
// Artifacts to its backing Stack or EdgeStack and filtering out any the user cannot access.
// A workflow with zero artifacts to begin with is a valid, visible state and is returned as-is.
// ErrNotFound is returned when the workflow itself does not exist, or when it had artifacts but
// every one of them was filtered out (existence-hiding for the common single-artifact case).
func fetchWorkflowByID(
	tx dataservices.DataStoreTx,
	k8sFactory *cli.ClientFactory,
	sc *security.RestrictedRequestContext,
	workflowID portainer.WorkflowID,
) (*svc.Workflow, error) {
	wf, err := tx.Workflow().Read(workflowID)
	if err != nil {
		return nil, fmt.Errorf("%w: %w", ErrNotFound, err)
	}

	sourceMap := map[portainer.SourceID]portainer.Source{}
	if len(wf.Artifacts) > 0 {
		userContext := source.NewUserContext(sc.User, sc.UserMemberships)
		sourceMap, err = svc.LoadWorkflowSources(tx, userContext, wf)
		if err != nil {
			return nil, err
		}
	}

	artifacts := make([]svc.ArtifactDetail, 0, len(wf.Artifacts))
	for _, a := range wf.Artifacts {
		detail, err := fetchArtifactDetail(tx, k8sFactory, sc, a, sourceMap)
		if errors.Is(err, ErrNotFound) || errors.Is(err, ErrResourceNotAccessible) {
			continue
		}
		if err != nil {
			return nil, err
		}
		artifacts = append(artifacts, *detail)
	}

	if len(wf.Artifacts) > 0 && len(artifacts) == 0 {
		return nil, ErrNotFound
	}

	result := svc.BuildWorkflow(*wf, artifacts)
	return &result, nil
}

// fetchArtifactDetail resolves a single Artifact to its backing Stack or EdgeStack.
func fetchArtifactDetail(
	tx dataservices.DataStoreTx,
	k8sFactory *cli.ClientFactory,
	sc *security.RestrictedRequestContext,
	artifact portainer.Artifact,
	sourceMap map[portainer.SourceID]portainer.Source,
) (*svc.ArtifactDetail, error) {
	switch {
	case artifact.StackID != 0:
		stack, err := tx.Stack().Read(artifact.StackID)
		if tx.IsErrObjectNotFound(err) {
			return nil, ErrNotFound
		}
		if err != nil {
			return nil, err
		}
		return fetchStackArtifact(tx, k8sFactory, sc, *stack, artifact, sourceMap)

	case artifact.EdgeStackID != 0:
		if !sc.IsAdmin {
			return nil, ErrResourceNotAccessible
		}
		edgeStack, err := tx.EdgeStack().EdgeStack(artifact.EdgeStackID)
		if tx.IsErrObjectNotFound(err) {
			return nil, ErrNotFound
		}
		if err != nil {
			return nil, err
		}
		return fetchEdgeStackArtifact(tx, *edgeStack, artifact, sourceMap)

	default:
		return nil, ErrNotFound
	}
}

// fetchStackArtifact resolves a stack-backed Artifact, applying the same endpoint/type-match and
// access checks as FetchWorkflows, scoped to a single stack.
func fetchStackArtifact(
	tx dataservices.DataStoreTx,
	k8sFactory *cli.ClientFactory,
	sc *security.RestrictedRequestContext,
	stack portainer.Stack,
	artifact portainer.Artifact,
	sourceMap map[portainer.SourceID]portainer.Source,
) (*svc.ArtifactDetail, error) {
	endpointMap, err := svc.BuildEndpointMap(tx, []portainer.Stack{stack})
	if err != nil {
		return nil, err
	}

	if err := checkStackAccessible(tx, k8sFactory, sc, stack, endpointMap, artifact, sourceMap); err != nil {
		return nil, err
	}

	sourcePhase, artifactPhase := svc.ArtifactPhases(artifact.Files, sourceMap)

	detail := svc.MapStackToArtifactDetail(stack, artifact.Files, sourcePhase, artifactPhase)
	return &detail, nil
}

// checkStackAccessible returns ErrResourceNotAccessible if sc cannot access stack, either because
// its endpoint's Kubernetes namespace/source access is insufficient or because Docker's
// resource-control-based UAC filters it out.
func checkStackAccessible(
	tx dataservices.DataStoreTx,
	k8sFactory *cli.ClientFactory,
	sc *security.RestrictedRequestContext,
	stack portainer.Stack,
	endpointMap map[portainer.EndpointID]portainer.Endpoint,
	artifact portainer.Artifact,
	sourceMap map[portainer.SourceID]portainer.Source,
) error {
	if stack.Type != portainer.KubernetesStack {
		accessible, err := svc.FilterDockerStacksByAccess(tx, []portainer.Stack{stack}, sc)
		if err != nil {
			return err
		}

		if len(accessible) == 0 {
			return ErrResourceNotAccessible
		}

		return nil
	}

	ep, epOk := endpointMap[stack.EndpointID]
	if !epOk {
		return ErrResourceNotAccessible
	}

	access, err := svc.ResolveKubeAccess(k8sFactory, sc, &ep)
	if err != nil {
		log.Warn().Err(err).Str("context", "checkStackAccessible").Int("endpoint_id", int(ep.ID)).Msg("Failed to resolve kube access for endpoint, filtering artifact")
		return ErrResourceNotAccessible
	}

	if (!access.IsKubeAdmin && !slices.Contains(access.NonAdminNamespaces, stack.Namespace)) || !svc.HasAccessibleSource(artifact.Files, sourceMap) {
		return ErrResourceNotAccessible
	}

	return nil
}

// fetchEdgeStackArtifact resolves an edge-stack-backed Artifact. The caller (fetchArtifactDetail)
// has already gated access via sc.IsAdmin, so edge stacks are visible to admins only.
func fetchEdgeStackArtifact(
	tx dataservices.DataStoreTx,
	edgeStack portainer.EdgeStack,
	artifact portainer.Artifact,
	sourceMap map[portainer.SourceID]portainer.Source,
) (*svc.ArtifactDetail, error) {
	statuses, err := tx.EdgeStackStatus().ReadAll(edgeStack.ID)
	if err != nil {
		return nil, err
	}

	groupIDSet := set.ToSet(edgeStack.EdgeGroups)
	edgeGroups, err := tx.EdgeGroup().ReadAll(func(g portainer.EdgeGroup) bool {
		return groupIDSet.Contains(g.ID)
	})
	if err != nil {
		return nil, err
	}

	groupEndpoints, err := svc.BuildGroupEndpoints(tx, edgeGroups)
	if err != nil {
		return nil, err
	}

	sourcePhase, artifactPhase := svc.ArtifactPhases(artifact.Files, sourceMap)

	detail := svc.MapEdgeStackToArtifactDetail(edgeStack, artifact.Files, statuses, groupEndpoints, sourcePhase, artifactPhase)
	return &detail, nil
}
