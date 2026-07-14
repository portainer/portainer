package workflows

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/dataservices/source"
	"github.com/portainer/portainer/api/datastore"
	gittypes "github.com/portainer/portainer/api/git/types"
	ce "github.com/portainer/portainer/api/gitops/workflows"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/stacks/stackutils"

	"github.com/stretchr/testify/require"
)

func adminContext() *security.RestrictedRequestContext {
	return &security.RestrictedRequestContext{
		IsAdmin: true,
		UserID:  1,
		User:    &portainer.User{ID: 1, Role: portainer.AdministratorRole},
	}
}

func nonAdminContext() *security.RestrictedRequestContext {
	return &security.RestrictedRequestContext{
		IsAdmin: false,
		UserID:  2,
		User:    &portainer.User{ID: 2, Role: portainer.StandardUserRole},
	}
}

func mustCreateGitWorkflow(t *testing.T, tx dataservices.DataStoreTx, stack *portainer.Stack) {
	t.Helper()

	cfg := stack.GitConfig

	src := &portainer.Source{Type: portainer.SourceTypeGit, Git: &gittypes.GitSource{URL: cfg.URL, Authentication: cfg.Authentication, TLSSkipVerify: cfg.TLSSkipVerify}}
	require.NoError(t, tx.Source().Create(source.InsecureNewAdminContext(), src))

	wf := &portainer.Workflow{Artifacts: []portainer.Artifact{{
		StackID: stack.ID,
		Files:   []portainer.ArtifactFile{{SourceID: src.ID}},
	}}}
	require.NoError(t, tx.Workflow().Create(wf))

	stack.WorkflowID = wf.ID
	stack.GitConfig = nil

	require.NoError(t, tx.Stack().Create(stack))
}

func TestFetchWorkflowByID_SingleStackArtifact(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var wfID portainer.WorkflowID
	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		stack := &portainer.Stack{ID: 1, Name: "gitops-stack", GitConfig: &gittypes.RepoConfig{URL: "https://github.com/x/repo", ConfigFilePath: "docker-compose.yml"}}
		mustCreateGitWorkflow(t, tx, stack)
		wfID = stack.WorkflowID

		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	var detail *ce.Workflow
	require.NoError(t, store.ViewTx(func(tx dataservices.DataStoreTx) error {
		var err error
		detail, err = fetchWorkflowByID(tx, nil, adminContext(), wfID)
		return err
	}))

	require.Len(t, detail.Artifacts, 1)
	require.Equal(t, "gitops-stack", detail.Artifacts[0].Name)
	require.Equal(t, ce.TypeStack, detail.Artifacts[0].Type)
	require.Len(t, detail.Artifacts[0].Files, 1)
}

func TestFetchWorkflowByID_EdgeStackArtifact_Admin(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var wfID portainer.WorkflowID
	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		wf := &portainer.Workflow{Artifacts: []portainer.Artifact{{EdgeStackID: 1}}}
		require.NoError(t, tx.Workflow().Create(wf))
		wfID = wf.ID

		require.NoError(t, tx.EdgeStack().Create(1, &portainer.EdgeStack{ID: 1, Name: "edge-stack"}))

		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	var detail *ce.Workflow
	require.NoError(t, store.ViewTx(func(tx dataservices.DataStoreTx) error {
		var err error
		detail, err = fetchWorkflowByID(tx, nil, adminContext(), wfID)
		return err
	}))

	require.Len(t, detail.Artifacts, 1)
	require.Equal(t, "edge-stack", detail.Artifacts[0].Name)
	require.Equal(t, ce.TypeEdgeStack, detail.Artifacts[0].Type)
}

func TestFetchWorkflowByID_EdgeStackArtifactFilteredForNonAdmin_SiblingStackSurvives(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var wfID portainer.WorkflowID
	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		wf := &portainer.Workflow{Artifacts: []portainer.Artifact{{StackID: 1}, {EdgeStackID: 1}}}
		require.NoError(t, tx.Workflow().Create(wf))
		wfID = wf.ID

		require.NoError(t, tx.Stack().Create(&portainer.Stack{ID: 1, Name: "docker-stack", WorkflowID: wf.ID}))
		require.NoError(t, tx.ResourceControl().Create(&portainer.ResourceControl{
			ResourceID: stackutils.ResourceControlID(0, "docker-stack"),
			Type:       portainer.StackResourceControl,
			Public:     true,
		}))
		require.NoError(t, tx.EdgeStack().Create(1, &portainer.EdgeStack{ID: 1, Name: "edge-stack"}))

		require.NoError(t, tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole}))
		return tx.User().Create(&portainer.User{ID: 2, Role: portainer.StandardUserRole})
	}))

	var detail *ce.Workflow
	require.NoError(t, store.ViewTx(func(tx dataservices.DataStoreTx) error {
		var err error
		detail, err = fetchWorkflowByID(tx, nil, nonAdminContext(), wfID)
		return err
	}))

	require.Len(t, detail.Artifacts, 1)
	require.Equal(t, "docker-stack", detail.Artifacts[0].Name)
}

func TestFetchWorkflowByID_K8sStackWithNoAccessibleSourceIsFiltered(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var wfID portainer.WorkflowID
	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		require.NoError(t, tx.Endpoint().Create(&portainer.Endpoint{ID: 1, Type: portainer.KubernetesLocalEnvironment}))

		wf := &portainer.Workflow{Artifacts: []portainer.Artifact{{StackID: 1}}}
		require.NoError(t, tx.Workflow().Create(wf))
		wfID = wf.ID

		require.NoError(t, tx.Stack().Create(&portainer.Stack{ID: 1, Name: "k8s-stack", Type: portainer.KubernetesStack, EndpointID: 1, WorkflowID: wf.ID}))

		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	err := store.ViewTx(func(tx dataservices.DataStoreTx) error {
		_, err := fetchWorkflowByID(tx, nil, adminContext(), wfID)
		return err
	})
	require.ErrorIs(t, err, ErrNotFound)
}

func TestFetchWorkflowByID_K8sStackWithAccessibleSourceIsReturned(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var wfID portainer.WorkflowID
	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		require.NoError(t, tx.Endpoint().Create(&portainer.Endpoint{ID: 1, Type: portainer.KubernetesLocalEnvironment}))

		src := &portainer.Source{Type: portainer.SourceTypeGit, Git: &gittypes.GitSource{URL: "https://github.com/x/repo"}}
		require.NoError(t, tx.Source().Create(source.InsecureNewAdminContext(), src))

		wf := &portainer.Workflow{Artifacts: []portainer.Artifact{{
			StackID: 1,
			Files:   []portainer.ArtifactFile{{SourceID: src.ID}},
		}}}
		require.NoError(t, tx.Workflow().Create(wf))
		wfID = wf.ID

		require.NoError(t, tx.Stack().Create(&portainer.Stack{ID: 1, Name: "k8s-stack", Type: portainer.KubernetesStack, EndpointID: 1, WorkflowID: wf.ID}))

		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	var detail *ce.Workflow
	require.NoError(t, store.ViewTx(func(tx dataservices.DataStoreTx) error {
		var err error
		detail, err = fetchWorkflowByID(tx, nil, adminContext(), wfID)
		return err
	}))

	require.Len(t, detail.Artifacts, 1)
	require.Equal(t, "k8s-stack", detail.Artifacts[0].Name)
}

func TestFetchWorkflowByID_ZeroArtifactsIsNotAnError(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var wfID portainer.WorkflowID
	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		wf := &portainer.Workflow{Name: "empty-workflow"}
		require.NoError(t, tx.Workflow().Create(wf))
		wfID = wf.ID

		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	var detail *ce.Workflow
	require.NoError(t, store.ViewTx(func(tx dataservices.DataStoreTx) error {
		var err error
		detail, err = fetchWorkflowByID(tx, nil, adminContext(), wfID)
		return err
	}))

	require.Equal(t, "empty-workflow", detail.Name)
	require.Empty(t, detail.Artifacts)
}

func TestFetchWorkflowByID_AllArtifactsFilteredOutReturnsNotFound(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var wfID portainer.WorkflowID
	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		wf := &portainer.Workflow{Artifacts: []portainer.Artifact{{EdgeStackID: 1}}}
		require.NoError(t, tx.Workflow().Create(wf))
		wfID = wf.ID

		require.NoError(t, tx.EdgeStack().Create(1, &portainer.EdgeStack{ID: 1, Name: "edge-stack"}))

		return tx.User().Create(&portainer.User{ID: 2, Role: portainer.StandardUserRole})
	}))

	err := store.ViewTx(func(tx dataservices.DataStoreTx) error {
		_, err := fetchWorkflowByID(tx, nil, nonAdminContext(), wfID)
		return err
	})
	require.ErrorIs(t, err, ErrNotFound)
}

func TestFetchWorkflowByID_StaleArtifactReferenceIsFiltered(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var wfID portainer.WorkflowID
	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		wf := &portainer.Workflow{Artifacts: []portainer.Artifact{{StackID: 999}}}
		require.NoError(t, tx.Workflow().Create(wf))
		wfID = wf.ID

		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	err := store.ViewTx(func(tx dataservices.DataStoreTx) error {
		_, err := fetchWorkflowByID(tx, nil, adminContext(), wfID)
		return err
	})
	require.ErrorIs(t, err, ErrNotFound)
}

func TestFetchWorkflowByID_NotFoundWorkflowID(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.User().Create(&portainer.User{ID: 1, Role: portainer.AdministratorRole})
	}))

	err := store.ViewTx(func(tx dataservices.DataStoreTx) error {
		_, err := fetchWorkflowByID(tx, nil, adminContext(), 999)
		return err
	})
	require.True(t, store.IsErrObjectNotFound(err))
	require.ErrorIs(t, err, ErrNotFound)

}
