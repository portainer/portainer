package workflows

import (
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/stacks/stackutils"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestWorkflowsList_RBAC_NonAdminNoAccess(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	user := &portainer.User{
		ID:                      1,
		Username:                "standard",
		Role:                    portainer.StandardUserRole,
		PortainerAuthorizations: authorization.DefaultPortainerAuthorizations(),
	}
	require.NoError(t, store.User().Create(user))

	require.NoError(t, store.Endpoint().Create(&portainer.Endpoint{ID: 1, Name: "test-env"}))

	// Stack on endpoint 1 WITHOUT resource control — non-admin cannot see it
	createGitStack(t, store, &portainer.Stack{
		ID: 1, Name: "no-rc-stack", EndpointID: 1,
		GitConfig: gitConfig("https://github.com/x/no-rc"),
	})

	h := NewHandler(store, nil, nil)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildWorkflowsReq(t, 1, portainer.StandardUserRole, ""))

	items := decodeWorkflows(t, rr)
	assert.Empty(t, items, "non-admin without resource control access should see no stacks")
}

func TestWorkflowsList_RBAC_NonAdminWithAccess(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	user := &portainer.User{
		ID:                      1,
		Username:                "standard",
		Role:                    portainer.StandardUserRole,
		PortainerAuthorizations: authorization.DefaultPortainerAuthorizations(),
	}
	require.NoError(t, store.User().Create(user))

	require.NoError(t, store.Endpoint().Create(&portainer.Endpoint{ID: 1, Name: "test-env"}))

	const stackName = "rc-stack"
	createGitStack(t, store, &portainer.Stack{
		ID: 1, Name: stackName, EndpointID: 1,
		GitConfig: gitConfig("https://github.com/x/rc"),
	})

	require.NoError(t, store.ResourceControl().Create(&portainer.ResourceControl{
		ID:         1,
		ResourceID: stackutils.ResourceControlID(1, stackName),
		Type:       portainer.StackResourceControl,
		UserAccesses: []portainer.UserResourceAccess{
			{UserID: 1, AccessLevel: portainer.ReadWriteAccessLevel},
		},
	}))

	h := NewHandler(store, nil, nil)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, buildWorkflowsReq(t, 1, portainer.StandardUserRole, ""))

	items := decodeWorkflows(t, rr)
	require.Len(t, items, 1)
	assert.Equal(t, stackName, items[0].Name)
}
