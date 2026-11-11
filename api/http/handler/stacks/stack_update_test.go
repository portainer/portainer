package stacks

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strconv"
	"testing"

	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/portainer/portainer/api/stacks/deployments"
	"github.com/portainer/portainer/api/stacks/stackutils"
	"github.com/portainer/portainer/pkg/fips"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_updateStackInTx(t *testing.T) {
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
			_, handlerErr := setup.handler.updateStackInTx(tx, setup.req, setup.stack.ID, setup.endpoint.ID)
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
			updatedStack, handlerErr := setup.handler.updateStackInTx(tx, setup.req, setup.stack.ID, setup.endpoint.ID)
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
			_, handlerErr = setup.handler.updateStackInTx(tx, setup.req, 9999, setup.endpoint.ID)
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

		const missingEndpointID = portainer.EndpointID(2999)
		stack.EndpointID = missingEndpointID
		require.NoError(t, setup.store.Stack().Update(stack.ID, stack))

		var handlerErr *httperror.HandlerError
		_ = setup.store.UpdateTx(func(tx dataservices.DataStoreTx) error {
			_, handlerErr = setup.handler.updateStackInTx(tx, setup.req, stack.ID, missingEndpointID)
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
			_, handlerErr = setup.handler.updateStackInTx(tx, setup.req, stack.ID, stack.EndpointID)
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
			_, handlerErr = setup.handler.updateStackInTx(tx, setup.req, stack.ID, stack.EndpointID)
			return nil
		})

		require.NotNil(t, handlerErr, "handler error should be set")
		assert.Equal(t, http.StatusInternalServerError, handlerErr.StatusCode, "should return 500 Internal Server Error")
		assert.Contains(t, handlerErr.Message, "Unable to verify user authorizations to validate stack access", "error message should mention user authorizations")
	})
}

func TestStackUpdate(t *testing.T) {
	t.Helper()
	_, store := datastore.MustNewTestStore(t, true, true)

	testDataPath := filepath.Join(t.TempDir())
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
	handler := NewHandler(testhelpers.NewTestRequestBouncer())
	handler.DataStore = store
	handler.FileService = fileService
	handler.StackDeployer = testStackDeployer{}
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

func setupUpdateStackInTxTest(t *testing.T, stack *portainer.Stack, payload *updateComposeStackPayload) *updateStackInTxTestSetup {
	t.Helper()

	_, store := datastore.MustNewTestStore(t, true, true)

	testDataPath := filepath.Join(t.TempDir())
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
	handler := NewHandler(testhelpers.NewTestRequestBouncer())
	handler.DataStore = store
	handler.FileService = fileService
	handler.StackDeployer = testStackDeployer{}
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

type swarmStackManager struct {
	portainer.SwarmStackManager
}

func (manager swarmStackManager) NormalizeStackName(name string) string {
	return name
}

type testStackDeployer struct {
	deployments.StackDeployer
}

func (testStackDeployer) DeployComposeStack(stack *portainer.Stack, endpoint *portainer.Endpoint, registries []portainer.Registry, forcePullImage, forceRecreate bool) error {
	return nil
}

func (testStackDeployer) DeploySwarmStack(stack *portainer.Stack, endpoint *portainer.Endpoint, registries []portainer.Registry, prune, pullImage bool) error {
	return nil
}

func (testStackDeployer) DeployRemoteComposeStack(stack *portainer.Stack, endpoint *portainer.Endpoint, registries []portainer.Registry, forcePullImage, forceRecreate bool) error {
	return nil
}

func (testStackDeployer) DeployRemoteSwarmStack(stack *portainer.Stack, endpoint *portainer.Endpoint, registries []portainer.Registry, prune, pullImage bool) error {
	return nil
}

func TestStackUpdate_RejectsRebindingToAnotherEnvironment(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	standardUser := &portainer.User{ID: 2, Username: "standard", Role: portainer.StandardUserRole}
	require.NoError(t, store.User().Create(standardUser))

	allowedEndpoint, err := mockCreateEndpoint(store)
	require.NoError(t, err)

	victimEndpoint := &portainer.Endpoint{ID: 2, Name: "victim", SecuritySettings: allowedEndpoint.SecuritySettings}
	require.NoError(t, store.Endpoint().Create(victimEndpoint))

	victimStack := &portainer.Stack{
		ID:         1,
		Name:       "shared-name",
		EntryPoint: "docker-compose.yml",
		EndpointID: victimEndpoint.ID,
		Type:       portainer.DockerComposeStack,
	}
	require.NoError(t, store.Stack().Create(victimStack))
	require.NoError(t, store.ResourceControl().Create(&portainer.ResourceControl{
		ID:                 1,
		ResourceID:         stackutils.ResourceControlID(victimEndpoint.ID, victimStack.Name),
		Type:               portainer.StackResourceControl,
		AdministratorsOnly: true,
	}))

	shadowStack := &portainer.Stack{
		ID:         2,
		Name:       victimStack.Name,
		EntryPoint: "docker-compose.yml",
		EndpointID: allowedEndpoint.ID,
		Type:       portainer.DockerComposeStack,
	}
	require.NoError(t, store.Stack().Create(shadowStack))
	require.NoError(t, store.ResourceControl().Create(&portainer.ResourceControl{
		ID:           2,
		ResourceID:   stackutils.ResourceControlID(allowedEndpoint.ID, shadowStack.Name),
		Type:         portainer.StackResourceControl,
		UserAccesses: []portainer.UserResourceAccess{{UserID: standardUser.ID, AccessLevel: portainer.ReadWriteAccessLevel}},
	}))

	handler := NewHandler(testhelpers.NewTestRequestBouncer())
	handler.DataStore = store
	handler.StackDeployer = testStackDeployer{}
	handler.ComposeStackManager = testhelpers.NewComposeStackManager()

	jsonPayload, err := json.Marshal(&updateComposeStackPayload{
		StackFileContent: "version: '3'\nservices:\n  web:\n    image: nginx:latest",
	})
	require.NoError(t, err)

	req := httptest.NewRequest(
		http.MethodPut,
		fmt.Sprintf("/stacks/%d?endpointId=%d", victimStack.ID, allowedEndpoint.ID),
		bytes.NewBuffer(jsonPayload),
	)
	req = req.WithContext(security.StoreRestrictedRequestContext(req, &security.RestrictedRequestContext{
		UserID: standardUser.ID,
	}))

	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	require.Equal(t, http.StatusForbidden, rec.Code, rec.Body.String())

	stored, err := store.Stack().Read(victimStack.ID)
	require.NoError(t, err)
	require.Equal(t, victimEndpoint.ID, stored.EndpointID, "stack must stay on its own environment")
	require.Zero(t, stored.UpdateDate)
}
