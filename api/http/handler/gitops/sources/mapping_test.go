package sources

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/gitops/workflows"

	"github.com/stretchr/testify/require"
)

func TestMapEdgeStackToWorkflow_DockerPlatform(t *testing.T) {
	t.Parallel()

	es := portainer.EdgeStack{
		ID:             1,
		Name:           "docker-edge",
		DeploymentType: portainer.EdgeStackDeploymentCompose,
		EdgeGroups:     []portainer.EdgeGroupID{1},
		CreationDate:   1587399600,
	}
	cfg := &gittypes.RepoConfig{URL: "https://github.com/x/repo"}

	w := MapEdgeStackToWorkflow(2, es, 7, cfg, nil, map[portainer.EdgeGroupID][]portainer.EndpointID{1: {10}}, workflows.WorkflowPhaseStatus{Status: workflows.StatusHealthy}, workflows.WorkflowPhaseStatus{Status: workflows.StatusHealthy})

	require.Equal(t, portainer.WorkflowID(2), w.ID)
	require.Equal(t, es.Name, w.Name)
	require.Equal(t, workflows.TypeEdgeStack, w.Type)
	require.Equal(t, workflows.DeploymentPlatformDockerStandalone, w.Platform)
	require.Equal(t, es.CreationDate, w.CreationDate)
	require.Equal(t, cfg, w.GitConfig)
	require.Equal(t, portainer.SourceID(7), w.SourceID)
	require.Equal(t, []portainer.EdgeGroupID{1}, w.Target.EdgeGroupIDs)
}

func TestMapEdgeStackToWorkflow_KubernetesPlatform(t *testing.T) {
	t.Parallel()

	es := portainer.EdgeStack{
		ID:             2,
		Name:           "kube-edge",
		DeploymentType: portainer.EdgeStackDeploymentKubernetes,
		EdgeGroups:     []portainer.EdgeGroupID{1},
	}

	w := MapEdgeStackToWorkflow(1, es, 0, nil, nil, map[portainer.EdgeGroupID][]portainer.EndpointID{}, workflows.WorkflowPhaseStatus{Status: workflows.StatusUnknown}, workflows.WorkflowPhaseStatus{Status: workflows.StatusUnknown})

	require.Equal(t, workflows.DeploymentPlatformKubernetes, w.Platform)
}

func TestMapEdgeStackToWorkflow_GroupStatusesAndResolvedEndpoints(t *testing.T) {
	t.Parallel()

	statuses := []portainer.EdgeStackStatusForEnv{
		{EndpointID: 10, Status: []portainer.EdgeStackDeploymentStatus{{Type: portainer.EdgeStackStatusRunning}}},
		{EndpointID: 20, Status: []portainer.EdgeStackDeploymentStatus{{Type: portainer.EdgeStackStatusError, Error: "boom"}}},
	}
	groupEndpoints := map[portainer.EdgeGroupID][]portainer.EndpointID{
		1: {10},
		2: {20},
	}
	es := portainer.EdgeStack{
		ID:         3,
		Name:       "multi-group",
		EdgeGroups: []portainer.EdgeGroupID{1, 2},
	}

	w := MapEdgeStackToWorkflow(5, es, 0, nil, statuses, groupEndpoints, workflows.WorkflowPhaseStatus{Status: workflows.StatusUnknown}, workflows.WorkflowPhaseStatus{Status: workflows.StatusUnknown})

	require.Equal(t, workflows.StatusHealthy, w.Target.GroupStatus[1])
	require.Equal(t, workflows.StatusError, w.Target.GroupStatus[2])
	require.Len(t, w.Target.ResolvedEndpointIDs, 2)
}
