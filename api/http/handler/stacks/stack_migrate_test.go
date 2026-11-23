package stacks

import (
	"bytes"
	"errors"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/filesystem"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/portainer/portainer/api/stacks/stackutils"

	"github.com/stretchr/testify/require"
)

const (
	migrateUserID portainer.UserID = 1

	migrateSourceEndpointID         portainer.EndpointID = 1
	migrateDeniedEndpointID         portainer.EndpointID = 2
	migrateManageDisabledEndpointID portainer.EndpointID = 3
	migrateAllowedEndpointID        portainer.EndpointID = 4
	migrateUnknownEndpointID        portainer.EndpointID = 99
	migrateStackID                  portainer.StackID    = 1
	migrateStackName                                     = "owned-stack"
	migrateStackFile                                     = "docker-compose.yml"
	migrateStackFileContent                              = "services:\n  web:\n    image: nginx:latest\n    network_mode: none\n"
)

// migrateBouncer denies environment access to a fixed set of environments, like the production
// bouncer does for a user without an access policy on them
type migrateBouncer struct {
	security.BouncerService
}

func (b migrateBouncer) AuthorizedEndpointOperation(_ *http.Request, endpoint *portainer.Endpoint) error {
	if endpoint.ID == migrateDeniedEndpointID {
		return httperrors.ErrEndpointAccessDenied
	}

	return nil
}

func newMigrateHandler(t *testing.T, role portainer.UserRole) (*Handler, *datastore.Store, *stubStackDeployer) {
	t.Helper()

	_, store := datastore.MustNewTestStore(t, true, false)

	err := store.User().Create(&portainer.User{ID: migrateUserID, Username: "user", Role: role})
	require.NoError(t, err)

	group := &portainer.EndpointGroup{Name: "Unassigned"}
	err = store.EndpointGroup().Create(group)
	require.NoError(t, err)

	endpoints := map[portainer.EndpointID]bool{
		migrateSourceEndpointID:         true,
		migrateDeniedEndpointID:         true,
		migrateManageDisabledEndpointID: false,
		migrateAllowedEndpointID:        true,
	}
	for id, allowManage := range endpoints {
		err := store.Endpoint().Create(&portainer.Endpoint{
			ID:               id,
			Name:             "env-" + strconv.Itoa(int(id)),
			Type:             portainer.DockerEnvironment,
			GroupID:          group.ID,
			SecuritySettings: portainer.EndpointSecuritySettings{AllowStackManagementForRegularUsers: allowManage},
		})
		require.NoError(t, err)
	}

	fileService, err := filesystem.NewService(t.TempDir(), "")
	require.NoError(t, err)

	projectPath, err := fileService.StoreStackFileFromBytes(strconv.Itoa(int(migrateStackID)), migrateStackFile, []byte(migrateStackFileContent))
	require.NoError(t, err)

	err = store.Stack().Create(&portainer.Stack{
		ID:          migrateStackID,
		Name:        migrateStackName,
		EndpointID:  migrateSourceEndpointID,
		Type:        portainer.DockerComposeStack,
		EntryPoint:  migrateStackFile,
		ProjectPath: projectPath,
	})
	require.NoError(t, err)

	rc := authorization.NewPrivateResourceControl(stackutils.ResourceControlID(migrateSourceEndpointID, migrateStackName), portainer.StackResourceControl, migrateUserID)
	err = store.ResourceControl().Create(rc)
	require.NoError(t, err)

	deployer := &stubStackDeployer{deployErr: errors.New("deploy stopped by test")}

	h := NewHandler(migrateBouncer{
		BouncerService: testhelpers.NewTestRequestBouncer(),
	}, nil)
	h.DataStore = store
	h.FileService = fileService
	h.StackDeployer = deployer

	return h, store, deployer
}

func migrateRequest(role portainer.UserRole, queryEndpointID, targetEndpointID portainer.EndpointID) *http.Request {
	target := "/stacks/" + strconv.Itoa(int(migrateStackID)) + "/migrate?endpointId=" + strconv.Itoa(int(queryEndpointID))
	body := `{"EndpointID":` + strconv.Itoa(int(targetEndpointID)) + `}`

	req := httptest.NewRequest(http.MethodPost, target, bytes.NewBufferString(body))
	req = req.WithContext(security.StoreTokenData(req, &portainer.TokenData{ID: migrateUserID, Role: role}))

	return req.WithContext(security.StoreRestrictedRequestContext(req, &security.RestrictedRequestContext{
		IsAdmin: role == portainer.AdministratorRole,
		UserID:  migrateUserID,
		User:    &portainer.User{ID: migrateUserID, Role: role},
	}))
}

func TestStackMigrate_TargetEndpointAuthorization(t *testing.T) {
	t.Parallel()

	f := func(role portainer.UserRole, queryEndpointID, targetEndpointID portainer.EndpointID, expectedStatus int) {
		t.Helper()

		h, store, deployer := newMigrateHandler(t, role)

		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, migrateRequest(role, queryEndpointID, targetEndpointID))
		require.Equal(t, expectedStatus, rr.Code, rr.Body.String())

		// The deploy stub fails on purpose, so only a request that passed every check reaches it
		require.Equal(t, expectedStatus == http.StatusInternalServerError, deployer.composeDeployed)

		stack, err := store.Stack().Read(migrateStackID)
		require.NoError(t, err)
		require.Equal(t, migrateSourceEndpointID, stack.EndpointID)

		_, err = store.ResourceControl().ResourceControlByResourceIDAndType(stackutils.ResourceControlID(migrateSourceEndpointID, migrateStackName), portainer.StackResourceControl)
		require.NoError(t, err)
	}

	// standard user is denied a target environment they have no access to
	f(portainer.StandardUserRole, migrateSourceEndpointID, migrateDeniedEndpointID, http.StatusForbidden)

	// standard user is denied a target environment where stack management is disabled for regular users
	f(portainer.StandardUserRole, migrateSourceEndpointID, migrateManageDisabledEndpointID, http.StatusForbidden)

	// standard user reaches the deployment on a target environment they can access and manage stacks on
	f(portainer.StandardUserRole, migrateSourceEndpointID, migrateAllowedEndpointID, http.StatusInternalServerError)

	// the endpointId query parameter does not change which environment is authorized or deployed to
	f(portainer.StandardUserRole, migrateAllowedEndpointID, migrateDeniedEndpointID, http.StatusForbidden)
	f(portainer.StandardUserRole, migrateDeniedEndpointID, migrateAllowedEndpointID, http.StatusInternalServerError)

	// admin reaches the deployment on a target environment where stack management is disabled for regular users
	f(portainer.AdministratorRole, migrateSourceEndpointID, migrateManageDisabledEndpointID, http.StatusInternalServerError)

	// unknown target environment
	f(portainer.StandardUserRole, migrateSourceEndpointID, migrateUnknownEndpointID, http.StatusNotFound)
}
