package stacks

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"
	"time"

	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/portainer/portainer/api/stacks/deployments"
	"github.com/portainer/portainer/api/stacks/stackutils"
	"github.com/portainer/portainer/pkg/fips"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_updateStackInTx(t *testing.T) {
	t.Parallel()
	t.Run("Transaction commits successfully - changes are persisted", func(t *testing.T) {
		payload := &updateComposeStackPayload{
			StackFileContent: "version: '3'\nservices:\n  web:\n    image: nginx:latest",
			Env:              []portainer.Pair{{Name: "FOO", Value: "BAR"}},
		}
		stack := &portainer.Stack{
			ID:         1,
			Name:       "test-stack-1",
			EntryPoint: "docker-compose.yml",
			Type:       portainer.DockerComposeStack,
		}
		setup := setupUpdateStackInTxTest(t, stack, payload)

		// Execute updateStackInTx within a successful transaction
		err := setup.store.UpdateTx(func(tx dataservices.DataStoreTx) error {
			_, _, _, handlerErr := setup.handler.updateStackInTx(tx, setup.req, setup.stack.ID, setup.endpoint.ID)
			if handlerErr != nil {
				return handlerErr
			}
			return nil
		})
		require.NoError(t, err, "transction should succeed")

		// Verify the stack was updated in the database (transaction committed)
		stackAfterCommit, err := setup.store.Stack().Read(setup.stack.ID)
		require.NoError(t, err, "should be able to read stack after commit")
		require.NotNil(t, stackAfterCommit)
		require.Equal(t, "BAR", stackAfterCommit.Env[0].Value, "stack env variable should be updated")
	})

	t.Run("Transaction rollback on error - changes not persisted", func(t *testing.T) {
		payload := &updateComposeStackPayload{
			StackFileContent: "version: '3'\nservices:\n  web:\n    image: nginx:latest",
			Env:              []portainer.Pair{{Name: "FOO", Value: "BAR"}},
		}
		stack := &portainer.Stack{
			ID:         1,
			Name:       "test-stack-1",
			EntryPoint: "docker-compose.yml",
			Type:       portainer.DockerComposeStack,
		}
		setup := setupUpdateStackInTxTest(t, stack, payload)

		// Execute updateStackInTx within a transaction that we force to fail
		err := setup.store.UpdateTx(func(tx dataservices.DataStoreTx) error {
			updatedStack, _, _, handlerErr := setup.handler.updateStackInTx(tx, setup.req, setup.stack.ID, setup.endpoint.ID)
			if handlerErr != nil {
				return handlerErr
			}

			// Verify changes are visible within the transaction
			assert.NotNil(t, updatedStack)
			assert.Equal(t, setup.user.Username, updatedStack.UpdatedBy)
			assert.NotZero(t, updatedStack.UpdateDate)

			// Force the transaction to fail by returning an error
			return errors.New("forced transaction failure")
		})

		// Verify the transaction failed
		require.Error(t, err)
		assert.Contains(t, err.Error(), "forced transaction failure")

		// Verify the stack was NOT updated in the database (transaction rolled back)
		stackAfterRollback, err := setup.store.Stack().Read(setup.stack.ID)
		require.NoError(t, err)
		require.Zero(t, stackAfterRollback.Env, "stack env variable should remain unchanged after rollback")
	})

	t.Run("Error: Stack not found returns NotFound httperror", func(t *testing.T) {
		payload := &updateComposeStackPayload{
			StackFileContent: "version: '3'\nservices:\n  web:\n    image: nginx:latest",
		}
		stack := &portainer.Stack{
			ID:         1,
			Name:       "test-stack-1",
			EntryPoint: "docker-compose.yml",
			Type:       portainer.DockerComposeStack,
		}
		setup := setupUpdateStackInTxTest(t, stack, payload)
		setup.req.URL.Path = "/stacks/9999" // Non-existent stack ID

		var handlerErr *httperror.HandlerError
		_ = setup.store.UpdateTx(func(tx dataservices.DataStoreTx) error {
			_, _, _, handlerErr = setup.handler.updateStackInTx(tx, setup.req, 9999, setup.endpoint.ID)
			return handlerErr
		})

		require.NotNil(t, handlerErr, "handler error should be set")
		assert.Equal(t, http.StatusNotFound, handlerErr.StatusCode, "should return 404 NotFound")
		assert.Contains(t, handlerErr.Message, "Unable to find a stack", "error message should mention stack")
	})

	t.Run("Error: Endpoint not found returns NotFound httperror", func(t *testing.T) {
		payload := &updateComposeStackPayload{
			StackFileContent: "version: '3'\nservices:\n  web:\n    image: nginx:latest",
		}
		stack := &portainer.Stack{
			ID:         1,
			Name:       "test-stack-1",
			EntryPoint: "docker-compose.yml",
			Type:       portainer.DockerComposeStack,
		}
		setup := setupUpdateStackInTxTest(t, stack, payload)

		var handlerErr *httperror.HandlerError
		_ = setup.store.UpdateTx(func(tx dataservices.DataStoreTx) error {
			_, _, _, handlerErr = setup.handler.updateStackInTx(tx, setup.req, stack.ID, 2999) // Non-existent endpoint ID
			return nil
		})

		require.NotNil(t, handlerErr, "handler error should be set")
		assert.Equal(t, http.StatusNotFound, handlerErr.StatusCode, "should return 404 NotFound")
		assert.Contains(t, handlerErr.Message, "Unable to find the environment", "error message should mention environment")
	})

	t.Run("Error: user cannot access the stack", func(t *testing.T) {
		payload := &updateComposeStackPayload{
			StackFileContent: "version: '3'\nservices:\n  web:\n    image: nginx:latest",
		}
		stack := &portainer.Stack{
			ID:         1,
			Name:       "test-stack-1",
			EntryPoint: "docker-compose.yml",
			Type:       portainer.DockerComposeStack,
		}
		setup := setupUpdateStackInTxTest(t, stack, payload)
		originalUser, err := setup.store.User().Read(setup.user.ID)
		require.NoError(t, err, "error reading user")

		// Modify the user's role to restrict access
		originalUser.Role = portainer.StandardUserRole
		err = setup.store.User().Update(originalUser.ID, originalUser)
		require.NoError(t, err, "error updating user role")

		var handlerErr *httperror.HandlerError
		_ = setup.store.UpdateTx(func(tx dataservices.DataStoreTx) error {
			_, _, _, handlerErr = setup.handler.updateStackInTx(tx, setup.req, stack.ID, stack.EndpointID)
			return nil
		})

		require.NotNil(t, handlerErr, "handler error should be set")
		assert.Equal(t, http.StatusForbidden, handlerErr.StatusCode, "should return 403 Forbidden")
		assert.Contains(t, handlerErr.Message, "Access denied", "error message should mention access")
	})

	t.Run("Error: user not found", func(t *testing.T) {
		payload := &updateComposeStackPayload{
			StackFileContent: "version: '3'\nservices:\n  web:\n    image: nginx:latest",
		}
		stack := &portainer.Stack{
			ID:         1,
			Name:       "test-stack-1",
			EntryPoint: "docker-compose.yml",
			Type:       portainer.DockerComposeStack,
		}
		setup := setupUpdateStackInTxTest(t, stack, payload)
		err := setup.store.User().Delete(setup.user.ID) // Delete the user to simulate "user not found"
		require.NoError(t, err, "error deleting user")

		var handlerErr *httperror.HandlerError
		_ = setup.store.UpdateTx(func(tx dataservices.DataStoreTx) error {
			_, _, _, handlerErr = setup.handler.updateStackInTx(tx, setup.req, stack.ID, stack.EndpointID)
			return nil
		})

		require.NotNil(t, handlerErr, "handler error should be set")
		assert.Equal(t, http.StatusInternalServerError, handlerErr.StatusCode, "should return 500 Internal Server Error")
		assert.Contains(t, handlerErr.Message, "Unable to verify user authorizations to validate stack access", "error message should mention user authorizations")
	})
}

func TestStackUpdate(t *testing.T) {
	t.Parallel()
	t.Helper()
	_, store := datastore.MustNewTestStore(t, false, true)

	testDataPath := filesystem.JoinPaths(t.TempDir())
	fileService, err := filesystem.NewService(testDataPath, "")
	require.NoError(t, err, "error init file service")

	// Create test user
	_, err = mockCreateUser(store)
	require.NoError(t, err, "error creating user")

	// Create test endpoint
	endpoint, err := mockCreateEndpoint(store)
	require.NoError(t, err, "error creating endpoint")

	// Create test stack
	stack := &portainer.Stack{
		ID:          1,
		Name:        "test-stack-1",
		EntryPoint:  "docker-compose.yml",
		EndpointID:  endpoint.ID,
		ProjectPath: fileService.GetDatastorePath() + fmt.Sprintf("/compose/%d", 1),
		Type:        portainer.DockerSwarmStack,
	}

	err = store.Stack().Create(stack)
	require.NoError(t, err, "error creating stack")

	// Create resource control for the stack
	resourceControl := &portainer.ResourceControl{
		ID:                 portainer.ResourceControlID(stack.ID),
		ResourceID:         stackutils.ResourceControlID(stack.EndpointID, stack.Name),
		Type:               portainer.StackResourceControl,
		AdministratorsOnly: false,
	}
	err = store.ResourceControl().Create(resourceControl)
	require.NoError(t, err, "error creating resource control")

	// Store initial stack file
	_, err = fileService.StoreStackFileFromBytes(
		strconv.Itoa(int(stack.ID)),
		stack.EntryPoint,
		[]byte("version: '3'\nservices:\n  web:\n    image: nginx:v1"),
	)
	require.NoError(t, err, "error storing stack file")

	// Create handler
	handler := NewHandler(testhelpers.NewTestRequestBouncer(), nil)
	handler.DataStore = store
	handler.FileService = fileService
	handler.StackDeployer = testhelpers.NewTestStackDeployer()
	handler.ComposeStackManager = testhelpers.NewComposeStackManager()
	handler.SwarmStackManager = swarmStackManager{}

	payload := &updateComposeStackPayload{
		StackFileContent: "version: '3'\nservices:\n  web:\n    image: nginx:latest",
	}
	// Create mock request with security context
	jsonPayload, err := json.Marshal(payload)
	require.NoError(t, err)

	t.Run("Endpoint is not provided in query param nor header", func(t *testing.T) {
		req := mockCreateStackRequestWithSecurityContext(
			http.MethodPut,
			fmt.Sprintf("/stacks/%d", stack.ID),
			bytes.NewBuffer(jsonPayload),
		)

		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)

		require.Equal(t, http.StatusBadRequest, rec.Code, "expected status BadRequest when endpoint is not provided")
	})

	t.Run("Stack doesn't exist", func(t *testing.T) {
		req := mockCreateStackRequestWithSecurityContext(
			http.MethodPut,
			fmt.Sprintf("/stacks/test-stack-1?endpointId=%d", endpoint.ID),
			bytes.NewBuffer(jsonPayload),
		)

		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)

		require.Equal(t, http.StatusBadRequest, rec.Code, "expected status NotFound when stack doesn't exist")
	})

	t.Run("Update stack successfully", func(t *testing.T) {
		fips.InitFIPS(false)

		req := mockCreateStackRequestWithSecurityContext(
			http.MethodPut,
			fmt.Sprintf("/stacks/%d?endpointId=%d", stack.ID, endpoint.ID),
			bytes.NewBuffer(jsonPayload),
		)

		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)

		require.Equal(t, http.StatusOK, rec.Code, "expected status OK when stack is updated successfully")
		var stackResponse portainer.Stack
		err = json.NewDecoder(rec.Body).Decode(&stackResponse)
		require.NoError(t, err, "error decoding response body")
		require.NotZero(t, stackResponse.UpdateDate, "stack update date should be set")
	})
}

// setupUpdateStackInTxTest creates a fresh test environment for each subtest
type updateStackInTxTestSetup struct {
	store           *datastore.Store
	fileService     portainer.FileService
	handler         *Handler
	user            *portainer.User
	endpoint        *portainer.Endpoint
	stack           *portainer.Stack
	resourceControl *portainer.ResourceControl
	jsonPayload     []byte
	req             *http.Request
}

type testUpdateStackPayload interface {
	*updateComposeStackPayload | *updateSwarmStackPayload
}

func setupUpdateStackInTxTest[T testUpdateStackPayload](t *testing.T, stack *portainer.Stack, payload T) *updateStackInTxTestSetup {
	t.Helper()

	_, store := datastore.MustNewTestStore(t, false, true)

	testDataPath := filesystem.JoinPaths(t.TempDir())
	fileService, err := filesystem.NewService(testDataPath, "")
	require.NoError(t, err, "error init file service")

	// Create test user
	user, err := mockCreateUser(store)
	require.NoError(t, err, "error creating user")

	// Create test endpoint
	endpoint, err := mockCreateEndpoint(store)
	require.NoError(t, err, "error creating endpoint")

	// Create test stack
	stack.EndpointID = endpoint.ID
	stack.ProjectPath = fileService.GetDatastorePath() + fmt.Sprintf("/compose/%d", stack.ID)

	err = store.Stack().Create(stack)
	require.NoError(t, err, "error creating stack")

	// Create resource control for the stack
	resourceControl := &portainer.ResourceControl{
		ID:                 portainer.ResourceControlID(stack.ID),
		ResourceID:         stackutils.ResourceControlID(stack.EndpointID, stack.Name),
		Type:               portainer.StackResourceControl,
		AdministratorsOnly: false,
	}
	err = store.ResourceControl().Create(resourceControl)
	require.NoError(t, err, "error creating resource control")

	// Store initial stack file
	_, err = fileService.StoreStackFileFromBytes(
		strconv.Itoa(int(stack.ID)),
		stack.EntryPoint,
		[]byte("version: '3'\nservices:\n  web:\n    image: nginx:v1"),
	)
	require.NoError(t, err, "error storing stack file")

	// Create handler
	handler := NewHandler(testhelpers.NewTestRequestBouncer(), nil)
	handler.DataStore = store
	handler.FileService = fileService
	handler.StackDeployer = testhelpers.NewTestStackDeployer()
	handler.ComposeStackManager = testhelpers.NewComposeStackManager()

	// Create mock request with security context
	jsonPayload, err := json.Marshal(payload)
	require.NoError(t, err)

	req := mockCreateStackRequestWithSecurityContext(
		http.MethodPut,
		fmt.Sprintf("/stacks/%d?endpointId=%d", stack.ID, endpoint.ID),
		bytes.NewBuffer(jsonPayload),
	)

	return &updateStackInTxTestSetup{
		store:           store,
		fileService:     fileService,
		handler:         handler,
		user:            user,
		endpoint:        endpoint,
		stack:           stack,
		resourceControl: resourceControl,
		jsonPayload:     jsonPayload,
		req:             req,
	}
}

// Test_updateComposeStack_WorkflowAlreadyDeleted_StillUpdatesStack covers a double-submit race: a
// concurrent request (e.g. a second click before the update button disables) already deleted the
// stack's shared Workflow record before this request's transaction runs. The stack update must
// still succeed rather than failing to detach the stack from its now-gone Workflow.
func Test_updateComposeStack_WorkflowAlreadyDeleted_StillUpdatesStack(t *testing.T) {
	t.Parallel()
	fips.InitFIPS(false)

	payload := &updateComposeStackPayload{
		StackFileContent: "version: '3'\nservices:\n  web:\n    image: nginx:latest",
	}
	stack := &portainer.Stack{
		ID:         1,
		Name:       "test-stack-workflow-gone",
		EntryPoint: "docker-compose.yml",
		Type:       portainer.DockerComposeStack,
		WorkflowID: 999,
	}
	setup := setupUpdateStackInTxTest(t, stack, payload)

	var handlerErr *httperror.HandlerError
	err := setup.store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		_, _, _, handlerErr = setup.handler.updateStackInTx(tx, setup.req, setup.stack.ID, setup.endpoint.ID)
		return nil
	})
	require.NoError(t, err)
	require.Nil(t, handlerErr, "stack update should succeed even though its Workflow was already gone")

	stored, err := setup.store.Stack().Read(setup.stack.ID)
	require.NoError(t, err)
	assert.Zero(t, stored.WorkflowID, "stack should be detached from the now-gone Workflow")
}

// Test_updateSwarmStack_WorkflowAlreadyDeleted_StillUpdatesStack mirrors
// Test_updateComposeStack_WorkflowAlreadyDeleted_StillUpdatesStack for Swarm stacks.
func Test_updateSwarmStack_WorkflowAlreadyDeleted_StillUpdatesStack(t *testing.T) {
	t.Parallel()
	fips.InitFIPS(false)

	payload := &updateSwarmStackPayload{
		StackFileContent: "version: '3'\nservices:\n  web:\n    image: nginx:latest",
	}
	stack := &portainer.Stack{
		ID:         1,
		Name:       "test-stack-workflow-gone",
		EntryPoint: "docker-compose.yml",
		Type:       portainer.DockerSwarmStack,
		WorkflowID: 999,
	}
	setup := setupUpdateStackInTxTest(t, stack, payload)
	setup.handler.SwarmStackManager = swarmStackManager{}

	var handlerErr *httperror.HandlerError
	err := setup.store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		_, _, _, handlerErr = setup.handler.updateStackInTx(tx, setup.req, setup.stack.ID, setup.endpoint.ID)
		return nil
	})
	require.NoError(t, err)
	require.Nil(t, handlerErr, "stack update should succeed even though its Workflow was already gone")

	stored, err := setup.store.Stack().Read(setup.stack.ID)
	require.NoError(t, err)
	assert.Zero(t, stored.WorkflowID, "stack should be detached from the now-gone Workflow")
}

type swarmStackManager struct {
	portainer.SwarmStackManager
}

func (manager swarmStackManager) NormalizeStackName(name string) string {
	return name
}

func Test_updateSwarmStack_Prune(t *testing.T) {
	t.Parallel()
	fips.InitFIPS(false)

	payload := &updateSwarmStackPayload{
		StackFileContent: "version: '3'\nservices:\n  web:\n    image: nginx:latest",
		Prune:            true,
	}
	stack := &portainer.Stack{
		ID:         1,
		Name:       "test-stack-prune",
		EntryPoint: "docker-compose.yml",
		Type:       portainer.DockerSwarmStack,
	}
	setup := setupUpdateStackInTxTest(t, stack, payload)
	setup.handler.SwarmStackManager = swarmStackManager{}
	deployer := testhelpers.NewTestStackDeployer()
	setup.handler.StackDeployer = deployer

	var deploymentConfig deployments.StackDeploymentConfiger
	var postDeploy postDeployFunc
	err := setup.store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		var handlerErr *httperror.HandlerError
		_, deploymentConfig, postDeploy, handlerErr = setup.handler.updateStackInTx(tx, setup.req, setup.stack.ID, setup.endpoint.ID)
		if handlerErr != nil {
			return handlerErr
		}
		return nil
	})
	require.NoError(t, err, "handler should accept Prune=true and succeed")

	stored, err := setup.store.Stack().Read(setup.stack.ID)
	require.NoError(t, err)
	require.NotNil(t, stored.Option, "stack.Option should not be nil")
	assert.True(t, stored.Option.Prune, "stack.Option.Prune should be persisted as true")

	go stackDeploy(setup.store, setup.stack.ID, deploymentConfig, postDeploy)

	require.Eventually(t, func() bool {
		return deployer.DeploySwarmCallCount == 1
	}, 5*time.Second, 10*time.Millisecond, "DeploySwarmStack should be called exactly once")
	assert.True(t, deployer.LastPrune, "deployer should be invoked with prune=true")
}

func Test_updateComposeStack_Prune(t *testing.T) {
	t.Parallel()
	fips.InitFIPS(false)

	payload := &updateComposeStackPayload{
		StackFileContent: "version: '3'\nservices:\n  web:\n    image: nginx:latest",
		Prune:            true,
	}
	stack := &portainer.Stack{
		ID:         1,
		Name:       "test-stack-prune",
		EntryPoint: "docker-compose.yml",
		Type:       portainer.DockerComposeStack,
	}
	setup := setupUpdateStackInTxTest(t, stack, payload)
	deployer := testhelpers.NewTestStackDeployer()
	setup.handler.StackDeployer = deployer

	var deploymentConfig deployments.StackDeploymentConfiger
	var postDeploy postDeployFunc
	err := setup.store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		var handlerErr *httperror.HandlerError
		_, deploymentConfig, postDeploy, handlerErr = setup.handler.updateStackInTx(tx, setup.req, setup.stack.ID, setup.endpoint.ID)
		if handlerErr != nil {
			return handlerErr
		}
		return nil
	})
	require.NoError(t, err, "handler should accept Prune=true and succeed")

	stored, err := setup.store.Stack().Read(setup.stack.ID)
	require.NoError(t, err)
	require.NotNil(t, stored.Option, "stack.Option should not be nil")
	assert.True(t, stored.Option.Prune, "stack.Option.Prune should be persisted as true")

	go stackDeploy(setup.store, setup.stack.ID, deploymentConfig, postDeploy)

	require.Eventually(t, func() bool {
		return deployer.DeployComposeCallCount == 1
	}, 5*time.Second, 10*time.Millisecond, "DeployComposeStack should be called exactly once")
	assert.True(t, deployer.LastPrune, "deployer should be invoked with prune=true")
}
