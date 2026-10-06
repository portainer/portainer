package namespacecleanup

import (
	"errors"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	kubecli "github.com/portainer/portainer/api/kubernetes/cli"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"k8s.io/apimachinery/pkg/runtime"
	kfake "k8s.io/client-go/kubernetes/fake"
	k8stesting "k8s.io/client-go/testing"
)

const (
	endpointID       portainer.EndpointID = 1
	otherEndpointID  portainer.EndpointID = 2
	deletedNamespace                      = "deleted-ns"
	otherNamespace                        = "other-ns"
)

var errInjected = errors.New("injected failure")

func newKubeClient() *kubecli.KubeClient {
	return kubecli.NewTestKubeClient(kfake.NewSimpleClientset())
}

func TestRemovePortainerRecords_RemovesOnlyTheDeletedNamespaceRecords(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, true, false)

	wf := &portainer.Workflow{Artifacts: []portainer.Artifact{{StackID: 1}}}
	deletedStack := &portainer.Stack{ID: 1, Namespace: deletedNamespace, EndpointID: endpointID}
	otherNamespaceStack := &portainer.Stack{ID: 2, Namespace: otherNamespace, EndpointID: endpointID}
	otherEndpointStack := &portainer.Stack{ID: 3, Namespace: deletedNamespace, EndpointID: otherEndpointID}
	boundRegistry := &portainer.Registry{RegistryAccesses: portainer.RegistryAccesses{
		endpointID:      {Namespaces: []string{deletedNamespace, otherNamespace}},
		otherEndpointID: {Namespaces: []string{deletedNamespace}},
	}}
	unboundRegistry := &portainer.Registry{RegistryAccesses: portainer.RegistryAccesses{
		endpointID: {Namespaces: []string{otherNamespace}},
	}}

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		if err := tx.Workflow().Create(wf); err != nil {
			return err
		}

		deletedStack.WorkflowID = wf.ID
		for _, s := range []*portainer.Stack{deletedStack, otherNamespaceStack, otherEndpointStack} {
			if err := tx.Stack().Create(s); err != nil {
				return err
			}
		}

		if err := tx.Registry().Create(boundRegistry); err != nil {
			return err
		}

		return tx.Registry().Create(unboundRegistry)
	}))

	require.NoError(t, RemovePortainerRecords(store, newKubeClient(), endpointID, deletedNamespace))

	require.NoError(t, store.ViewTx(func(tx dataservices.DataStoreTx) error {
		_, err := tx.Stack().Read(deletedStack.ID)
		assert.True(t, dataservices.IsErrObjectNotFound(err), "the deleted namespace's stack should be removed")

		_, err = tx.Workflow().Read(wf.ID)
		assert.True(t, dataservices.IsErrObjectNotFound(err), "the stack's single-artifact workflow should be removed with it")

		for _, id := range []portainer.StackID{otherNamespaceStack.ID, otherEndpointStack.ID} {
			_, err = tx.Stack().Read(id)
			assert.NoError(t, err, "stack %d does not belong to the deleted namespace", id)
		}

		registry, err := tx.Registry().Read(boundRegistry.ID)
		require.NoError(t, err)
		assert.Equal(t, []string{otherNamespace}, registry.RegistryAccesses[endpointID].Namespaces)
		assert.Equal(t, []string{deletedNamespace}, registry.RegistryAccesses[otherEndpointID].Namespaces, "other environments keep their bindings")

		registry, err = tx.Registry().Read(unboundRegistry.ID)
		require.NoError(t, err)
		assert.Equal(t, []string{otherNamespace}, registry.RegistryAccesses[endpointID].Namespaces)

		return nil
	}))
}

func TestRemovePortainerRecords_AccessPolicyFailure_KeepsRecords(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, true, false)

	stack := &portainer.Stack{ID: 1, Namespace: deletedNamespace, EndpointID: endpointID}
	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.Stack().Create(stack)
	}))

	clientset := kfake.NewSimpleClientset()
	clientset.PrependReactor("get", "configmaps", func(k8stesting.Action) (bool, runtime.Object, error) {
		return true, nil, errInjected
	})

	err := RemovePortainerRecords(store, kubecli.NewTestKubeClient(clientset), endpointID, deletedNamespace)
	require.ErrorIs(t, err, errInjected)

	require.NoError(t, store.ViewTx(func(tx dataservices.DataStoreTx) error {
		_, err := tx.Stack().Read(stack.ID)
		assert.NoError(t, err, "nothing else is removed when the access policy cannot be")

		return nil
	}))
}

func TestRemovePortainerRecords_DatastoreFailure_RollsBack(t *testing.T) {
	t.Parallel()

	for _, failure := range []string{registryReadFails, registryUpdateFails, stackReadFails, workflowReadFails, stackDeleteFails} {
		t.Run(failure, func(t *testing.T) {
			t.Parallel()
			_, store := datastore.MustNewTestStore(t, true, false)

			wf := &portainer.Workflow{Artifacts: []portainer.Artifact{{StackID: 1}}}
			stack := &portainer.Stack{ID: 1, Namespace: deletedNamespace, EndpointID: endpointID}
			registry := &portainer.Registry{RegistryAccesses: portainer.RegistryAccesses{
				endpointID: {Namespaces: []string{deletedNamespace}},
			}}
			require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
				if err := tx.Workflow().Create(wf); err != nil {
					return err
				}

				stack.WorkflowID = wf.ID
				if err := tx.Stack().Create(stack); err != nil {
					return err
				}

				return tx.Registry().Create(registry)
			}))

			err := RemovePortainerRecords(faultyStore{DataStore: store, failure: failure}, newKubeClient(), endpointID, deletedNamespace)
			require.ErrorIs(t, err, errInjected)

			require.NoError(t, store.ViewTx(func(tx dataservices.DataStoreTx) error {
				_, err := tx.Stack().Read(stack.ID)
				assert.NoError(t, err, "the stack deletion should roll back")

				stored, err := tx.Registry().Read(registry.ID)
				require.NoError(t, err)
				assert.Equal(t, []string{deletedNamespace}, stored.RegistryAccesses[endpointID].Namespaces, "the registry update should roll back")

				return nil
			}))
		})
	}
}

const (
	registryReadFails   = "registry read fails"
	registryUpdateFails = "registry update fails"
	stackReadFails      = "stack read fails"
	workflowReadFails   = "workflow read fails"
	stackDeleteFails    = "stack delete fails"
)

// faultyStore runs transactions against the real store but makes one datastore operation fail
type faultyStore struct {
	dataservices.DataStore
	failure string
}

func (s faultyStore) UpdateTx(fn func(dataservices.DataStoreTx) error) error {
	return s.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return fn(faultyTx{DataStoreTx: tx, failure: s.failure})
	})
}

type faultyTx struct {
	dataservices.DataStoreTx
	failure string
}

func (tx faultyTx) Registry() dataservices.RegistryService {
	return faultyRegistries{RegistryService: tx.DataStoreTx.Registry(), failure: tx.failure}
}

func (tx faultyTx) Stack() dataservices.StackService {
	return faultyStacks{StackService: tx.DataStoreTx.Stack(), failure: tx.failure}
}

func (tx faultyTx) Workflow() dataservices.WorkflowService {
	return faultyWorkflows{WorkflowService: tx.DataStoreTx.Workflow(), failure: tx.failure}
}

type faultyRegistries struct {
	dataservices.RegistryService
	failure string
}

func (s faultyRegistries) ReadAll(predicates ...func(portainer.Registry) bool) ([]portainer.Registry, error) {
	if s.failure == registryReadFails {
		return nil, errInjected
	}

	return s.RegistryService.ReadAll(predicates...)
}

func (s faultyRegistries) Update(id portainer.RegistryID, registry *portainer.Registry) error {
	if s.failure == registryUpdateFails {
		return errInjected
	}

	return s.RegistryService.Update(id, registry)
}

type faultyStacks struct {
	dataservices.StackService
	failure string
}

func (s faultyStacks) ReadAll(predicates ...func(portainer.Stack) bool) ([]portainer.Stack, error) {
	if s.failure == stackReadFails {
		return nil, errInjected
	}

	return s.StackService.ReadAll(predicates...)
}

func (s faultyStacks) Delete(id portainer.StackID) error {
	if s.failure == stackDeleteFails {
		return errInjected
	}

	return s.StackService.Delete(id)
}

type faultyWorkflows struct {
	dataservices.WorkflowService
	failure string
}

func (s faultyWorkflows) Read(id portainer.WorkflowID) (*portainer.Workflow, error) {
	if s.failure == workflowReadFails {
		return nil, errInjected
	}

	return s.WorkflowService.Read(id)
}
