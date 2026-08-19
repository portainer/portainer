package stacks

import (
	"io"
	"net/http"
	"net/http/httptest"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
)

func mockCreateUser(store *datastore.Store) (*portainer.User, error) {
	user := &portainer.User{ID: 1, Username: "testUser", Role: portainer.AdministratorRole, PortainerAuthorizations: authorization.DefaultPortainerAuthorizations()}
	err := store.User().Create(user)
	return user, err
}

func mockCreateEndpoint(store *datastore.Store) (*portainer.Endpoint, error) {
	endpoint := &portainer.Endpoint{
		ID:   1,
		Name: "testEndpoint",
		SecuritySettings: portainer.EndpointSecuritySettings{
			AllowBindMountsForRegularUsers:            true,
			AllowPrivilegedModeForRegularUsers:        true,
			AllowVolumeBrowserForRegularUsers:         true,
			AllowHostNamespaceForRegularUsers:         true,
			AllowDeviceMappingForRegularUsers:         true,
			AllowStackManagementForRegularUsers:       true,
			AllowContainerCapabilitiesForRegularUsers: true,
			AllowSysctlSettingForRegularUsers:         true,
			EnableHostManagementFeatures:              true,
		},
	}

	err := store.Endpoint().Create(endpoint)

	return endpoint, err
}

func mockCreateStackRequestWithSecurityContext(method, target string, body io.Reader) *http.Request {
	req := httptest.NewRequest(method,
		target,
		body)

	ctx := security.StoreRestrictedRequestContext(req, &security.RestrictedRequestContext{
		IsAdmin: true,
		UserID:  portainer.UserID(1),
		User:    &portainer.User{ID: 1, Role: portainer.AdministratorRole},
	})

	return req.WithContext(ctx)
}
