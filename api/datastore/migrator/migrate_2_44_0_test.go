package migrator

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/database/boltdb"
	"github.com/portainer/portainer/api/dataservices/source"
	"github.com/portainer/portainer/api/dataservices/stack"
	"github.com/portainer/portainer/api/dataservices/workflow"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/logs"

	"github.com/stretchr/testify/require"
)

func TestBackfillSourceInterval_2_44_0_MinimumIntervalWins(t *testing.T) {
	t.Parallel()

	conn := &boltdb.DbConnection{Path: t.TempDir()}
	err := conn.Open()
	require.NoError(t, err)
	defer logs.CloseAndLogErr(conn)

	stackSvc, err := stack.NewService(conn)
	require.NoError(t, err)
	sourceSvc, err := source.NewService(conn)
	require.NoError(t, err)
	workflowSvc, err := workflow.NewService(conn)
	require.NoError(t, err)

	m := NewMigrator(&MigratorParameters{
		StackService:    stackSvc,
		SourceService:   sourceSvc,
		WorkflowService: workflowSvc,
	})

	src := &portainer.Source{
		Type: portainer.SourceTypeGit,
		Git:  &gittypes.GitSource{URL: "https://github.com/example/shared-repo"},
	}
	err = sourceSvc.Create(adminUserContext, src)
	require.NoError(t, err)

	stackA := &portainer.Stack{ID: 1, Name: "stack-a", AutoUpdate: &portainer.AutoUpdateSettings{Interval: "10m"}}
	err = stackSvc.Create(stackA)
	require.NoError(t, err)

	stackB := &portainer.Stack{ID: 2, Name: "stack-b", AutoUpdate: &portainer.AutoUpdateSettings{Interval: "5m"}}
	err = stackSvc.Create(stackB)
	require.NoError(t, err)

	wfA := &portainer.Workflow{
		Name: "stack-a",
		Artifacts: []portainer.Artifact{{
			StackID: stackA.ID,
			Files:   []portainer.ArtifactFile{{SourceID: src.ID}},
		}},
	}
	err = workflowSvc.Create(wfA)
	require.NoError(t, err)

	wfB := &portainer.Workflow{
		Name: "stack-b",
		Artifacts: []portainer.Artifact{{
			StackID: stackB.ID,
			Files:   []portainer.ArtifactFile{{SourceID: src.ID}},
		}},
	}
	err = workflowSvc.Create(wfB)
	require.NoError(t, err)

	stackA.WorkflowID = wfA.ID
	err = stackSvc.Update(stackA.ID, stackA)
	require.NoError(t, err)

	stackB.WorkflowID = wfB.ID
	err = stackSvc.Update(stackB.ID, stackB)
	require.NoError(t, err)

	err = m.backfillSourceInterval_2_44_0()
	require.NoError(t, err)

	updatedSrc, err := sourceSvc.Read(adminUserContext, src.ID)
	require.NoError(t, err)
	require.Equal(t, "5m", updatedSrc.Interval)

	updatedA, err := stackSvc.Read(stackA.ID)
	require.NoError(t, err)
	require.NotNil(t, updatedA.AutoUpdate)
	require.Empty(t, updatedA.AutoUpdate.Interval)

	updatedB, err := stackSvc.Read(stackB.ID)
	require.NoError(t, err)
	require.NotNil(t, updatedB.AutoUpdate)
	require.Empty(t, updatedB.AutoUpdate.Interval)
}

func TestBackfillSourceInterval_2_44_0_WebhookOnlyStackLeftAlone(t *testing.T) {
	t.Parallel()

	conn := &boltdb.DbConnection{Path: t.TempDir()}
	err := conn.Open()
	require.NoError(t, err)
	defer logs.CloseAndLogErr(conn)

	stackSvc, err := stack.NewService(conn)
	require.NoError(t, err)
	sourceSvc, err := source.NewService(conn)
	require.NoError(t, err)
	workflowSvc, err := workflow.NewService(conn)
	require.NoError(t, err)

	m := NewMigrator(&MigratorParameters{
		StackService:    stackSvc,
		SourceService:   sourceSvc,
		WorkflowService: workflowSvc,
	})

	src := &portainer.Source{
		Type: portainer.SourceTypeGit,
		Git:  &gittypes.GitSource{URL: "https://github.com/example/webhook-repo"},
	}
	err = sourceSvc.Create(adminUserContext, src)
	require.NoError(t, err)

	webhookStack := &portainer.Stack{
		ID:   1,
		Name: "webhook-stack",
		AutoUpdate: &portainer.AutoUpdateSettings{
			Webhook: "05de31a2-79fa-4644-9c12-faa67e5c49f0",
		},
	}
	err = stackSvc.Create(webhookStack)
	require.NoError(t, err)

	wf := &portainer.Workflow{
		Name: "webhook-stack",
		Artifacts: []portainer.Artifact{{
			StackID: webhookStack.ID,
			Files:   []portainer.ArtifactFile{{SourceID: src.ID}},
		}},
	}
	err = workflowSvc.Create(wf)
	require.NoError(t, err)

	webhookStack.WorkflowID = wf.ID
	err = stackSvc.Update(webhookStack.ID, webhookStack)
	require.NoError(t, err)

	err = m.backfillSourceInterval_2_44_0()
	require.NoError(t, err)

	updatedSrc, err := sourceSvc.Read(adminUserContext, src.ID)
	require.NoError(t, err)
	require.Empty(t, updatedSrc.Interval)

	updatedStack, err := stackSvc.Read(webhookStack.ID)
	require.NoError(t, err)
	require.Equal(t, "05de31a2-79fa-4644-9c12-faa67e5c49f0", updatedStack.AutoUpdate.Webhook)
}

func TestBackfillSourceInterval_2_44_0_StackReferencingTwoSourcesBackfillsBoth(t *testing.T) {
	t.Parallel()

	conn := &boltdb.DbConnection{Path: t.TempDir()}
	err := conn.Open()
	require.NoError(t, err)
	defer logs.CloseAndLogErr(conn)

	stackSvc, err := stack.NewService(conn)
	require.NoError(t, err)
	sourceSvc, err := source.NewService(conn)
	require.NoError(t, err)
	workflowSvc, err := workflow.NewService(conn)
	require.NoError(t, err)

	m := NewMigrator(&MigratorParameters{
		StackService:    stackSvc,
		SourceService:   sourceSvc,
		WorkflowService: workflowSvc,
	})

	srcA := &portainer.Source{Type: portainer.SourceTypeGit, Git: &gittypes.GitSource{URL: "https://github.com/example/repo-a"}}
	err = sourceSvc.Create(adminUserContext, srcA)
	require.NoError(t, err)

	srcB := &portainer.Source{Type: portainer.SourceTypeGit, Git: &gittypes.GitSource{URL: "https://github.com/example/repo-b"}}
	err = sourceSvc.Create(adminUserContext, srcB)
	require.NoError(t, err)

	multiSourceStack := &portainer.Stack{ID: 1, Name: "multi-source-stack", AutoUpdate: &portainer.AutoUpdateSettings{Interval: "5m"}}
	err = stackSvc.Create(multiSourceStack)
	require.NoError(t, err)

	wf := &portainer.Workflow{
		Name: "multi-source-stack",
		Artifacts: []portainer.Artifact{{
			StackID: multiSourceStack.ID,
			Files: []portainer.ArtifactFile{
				{SourceID: srcA.ID},
				{SourceID: srcB.ID},
			},
		}},
	}
	err = workflowSvc.Create(wf)
	require.NoError(t, err)

	multiSourceStack.WorkflowID = wf.ID
	err = stackSvc.Update(multiSourceStack.ID, multiSourceStack)
	require.NoError(t, err)

	err = m.backfillSourceInterval_2_44_0()
	require.NoError(t, err)

	updatedA, err := sourceSvc.Read(adminUserContext, srcA.ID)
	require.NoError(t, err)
	require.Equal(t, "5m", updatedA.Interval)

	updatedB, err := sourceSvc.Read(adminUserContext, srcB.ID)
	require.NoError(t, err)
	require.Equal(t, "5m", updatedB.Interval)

	updatedStack, err := stackSvc.Read(multiSourceStack.ID)
	require.NoError(t, err)
	require.NotNil(t, updatedStack.AutoUpdate)
	require.Empty(t, updatedStack.AutoUpdate.Interval)
}
