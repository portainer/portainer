package migrator

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/database/boltdb"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/dataservices/edgegroup"
	"github.com/portainer/portainer/api/dataservices/edgestack"
	"github.com/portainer/portainer/api/dataservices/endpoint"
	"github.com/portainer/portainer/api/dataservices/stack"
	"github.com/portainer/portainer/api/dataservices/workflow"
	"github.com/portainer/portainer/api/logs"

	"github.com/stretchr/testify/require"
)

func TestCleanOrphanedWorkflowReferences_2_45_0(t *testing.T) {
	t.Parallel()

	conn := &boltdb.DbConnection{Path: t.TempDir()}
	err := conn.Open()
	require.NoError(t, err)
	defer logs.CloseAndLogErr(conn)

	endpointSvc, err := endpoint.NewService(conn)
	require.NoError(t, err)
	edgeGroupSvc, err := edgegroup.NewService(conn)
	require.NoError(t, err)
	workflowSvc, err := workflow.NewService(conn)
	require.NoError(t, err)

	m := NewMigrator(&MigratorParameters{
		EndpointService:  endpointSvc,
		EdgeGroupService: edgeGroupSvc,
		WorkflowService:  workflowSvc,
	})

	err = endpointSvc.Create(&portainer.Endpoint{ID: 1, Name: "env-1"})
	require.NoError(t, err)

	err = edgeGroupSvc.Create(&portainer.EdgeGroup{ID: 1, Name: "edgegroup-1"})
	require.NoError(t, err)

	wf := &portainer.Workflow{
		Name: "Test Workflow",
		Artifacts: []portainer.Artifact{{
			EnvIDs:     []portainer.EndpointID{1, 2},
			EdgeGroups: []portainer.EdgeGroupID{1, 2},
		}},
	}
	err = workflowSvc.Create(wf)
	require.NoError(t, err)

	untouchedWf := &portainer.Workflow{
		Name: "Untouched Workflow",
		Artifacts: []portainer.Artifact{{
			EnvIDs:     []portainer.EndpointID{1},
			EdgeGroups: []portainer.EdgeGroupID{1},
		}},
	}
	err = workflowSvc.Create(untouchedWf)
	require.NoError(t, err)

	err = m.cleanOrphanedWorkflowReferences_2_45_0()
	require.NoError(t, err)

	updatedWf, err := workflowSvc.Read(wf.ID)
	require.NoError(t, err)
	require.Len(t, updatedWf.Artifacts, 1)
	require.Equal(t, []portainer.EndpointID{1}, updatedWf.Artifacts[0].EnvIDs)
	require.Equal(t, []portainer.EdgeGroupID{1}, updatedWf.Artifacts[0].EdgeGroups)

	updatedUntouchedWf, err := workflowSvc.Read(untouchedWf.ID)
	require.NoError(t, err)
	require.Equal(t, []portainer.EndpointID{1}, updatedUntouchedWf.Artifacts[0].EnvIDs)
	require.Equal(t, []portainer.EdgeGroupID{1}, updatedUntouchedWf.Artifacts[0].EdgeGroups)
}

func TestPruneOrphanedStackArtifacts_2_45_0(t *testing.T) {
	t.Parallel()

	conn := &boltdb.DbConnection{Path: t.TempDir()}
	err := conn.Open()
	require.NoError(t, err)
	defer logs.CloseAndLogErr(conn)

	stackSvc, err := stack.NewService(conn)
	require.NoError(t, err)
	edgeStackSvc, err := edgestack.NewService(conn, func(portainer.Transaction, portainer.EdgeStackID) {})
	require.NoError(t, err)
	workflowSvc, err := workflow.NewService(conn)
	require.NoError(t, err)

	m := NewMigrator(&MigratorParameters{
		StackService:     stackSvc,
		EdgeStackService: edgeStackSvc,
		WorkflowService:  workflowSvc,
	})

	liveStack := &portainer.Stack{ID: 1, Name: "live-stack"}
	err = stackSvc.Create(liveStack)
	require.NoError(t, err)

	liveEdgeStack := &portainer.EdgeStack{ID: 1, Name: "live-edgestack"}
	err = edgeStackSvc.Create(liveEdgeStack.ID, liveEdgeStack)
	require.NoError(t, err)

	mixedWf := &portainer.Workflow{
		Name: "mixed-artifacts",
		Artifacts: []portainer.Artifact{
			{StackID: liveStack.ID},
			{StackID: 999},
			{EdgeStackID: liveEdgeStack.ID},
			{EdgeStackID: 999},
			{},
		},
	}
	err = workflowSvc.Create(mixedWf)
	require.NoError(t, err)

	fullyOrphanedWf := &portainer.Workflow{
		Name:      "fully-orphaned",
		Artifacts: []portainer.Artifact{{StackID: 999}},
	}
	err = workflowSvc.Create(fullyOrphanedWf)
	require.NoError(t, err)

	untouchedWf := &portainer.Workflow{
		Name:      "untouched",
		Artifacts: []portainer.Artifact{{StackID: liveStack.ID}},
	}
	err = workflowSvc.Create(untouchedWf)
	require.NoError(t, err)

	err = m.pruneOrphanedStackArtifacts_2_45_0()
	require.NoError(t, err)

	updatedMixedWf, err := workflowSvc.Read(mixedWf.ID)
	require.NoError(t, err)
	require.Len(t, updatedMixedWf.Artifacts, 2)
	require.Equal(t, liveStack.ID, updatedMixedWf.Artifacts[0].StackID)
	require.Equal(t, liveEdgeStack.ID, updatedMixedWf.Artifacts[1].EdgeStackID)

	_, err = workflowSvc.Read(fullyOrphanedWf.ID)
	require.True(t, dataservices.IsErrObjectNotFound(err))

	updatedUntouchedWf, err := workflowSvc.Read(untouchedWf.ID)
	require.NoError(t, err)
	require.Equal(t, untouchedWf.Artifacts, updatedUntouchedWf.Artifacts)
}
