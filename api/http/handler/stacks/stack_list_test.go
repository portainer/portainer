package stacks

import (
	"encoding/json"
	"net/http"
	"sort"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/portainer/portainer/api/stacks/stackutils"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestStackList_ExcludesStacksOnInaccessibleEnvironments(t *testing.T) {
	t.Parallel()

	const (
		userID            portainer.UserID     = 2
		accessibleEnvID   portainer.EndpointID = 1
		inaccessibleEnvID portainer.EndpointID = 2
		accessibleStackID portainer.StackID    = 1
		publicStackID     portainer.StackID    = 2
		userOwnedStackID  portainer.StackID    = 3
	)

	_, store := datastore.MustNewTestStore(t, false, true)

	// user IDs are assigned sequentially, and serveAsUser treats ID 1 as the admin
	require.NoError(t, store.User().Create(&portainer.User{Username: "admin", Role: portainer.AdministratorRole}))
	user := &portainer.User{Username: "standard", Role: portainer.StandardUserRole}
	require.NoError(t, store.User().Create(user))
	require.Equal(t, userID, user.ID)

	group := &portainer.EndpointGroup{Name: "Unassigned"}
	require.NoError(t, store.EndpointGroup().Create(group))

	require.NoError(t, store.Endpoint().Create(&portainer.Endpoint{
		ID:                 accessibleEnvID,
		Name:               "accessible",
		Type:               portainer.DockerEnvironment,
		GroupID:            group.ID,
		UserAccessPolicies: portainer.UserAccessPolicies{userID: {}},
	}))
	require.NoError(t, store.Endpoint().Create(&portainer.Endpoint{
		ID:      inaccessibleEnvID,
		Name:    "inaccessible",
		Type:    portainer.DockerEnvironment,
		GroupID: group.ID,
	}))

	stacks := []struct {
		stack portainer.Stack
		rc    *portainer.ResourceControl
	}{
		{
			stack: portainer.Stack{ID: accessibleStackID, Name: "accessible", EndpointID: accessibleEnvID, Type: portainer.DockerComposeStack},
			rc:    authorization.NewPublicResourceControl(stackutils.ResourceControlID(accessibleEnvID, "accessible"), portainer.StackResourceControl),
		},
		{
			stack: portainer.Stack{ID: publicStackID, Name: "public", EndpointID: inaccessibleEnvID, Type: portainer.DockerComposeStack},
			rc:    authorization.NewPublicResourceControl(stackutils.ResourceControlID(inaccessibleEnvID, "public"), portainer.StackResourceControl),
		},
		{
			stack: portainer.Stack{ID: userOwnedStackID, Name: "owned", EndpointID: inaccessibleEnvID, Type: portainer.DockerComposeStack},
			rc:    authorization.NewPrivateResourceControl(stackutils.ResourceControlID(inaccessibleEnvID, "owned"), portainer.StackResourceControl, userID),
		},
	}
	for i := range stacks {
		require.NoError(t, store.Stack().Create(&stacks[i].stack))
		require.NoError(t, store.ResourceControl().Create(stacks[i].rc))
	}

	handler := NewHandler(testhelpers.NewTestRequestBouncer(), nil)
	handler.DataStore = store

	rr := serveAsUser(handler, userID, "/stacks")
	require.Equal(t, http.StatusOK, rr.Code, rr.Body.String())

	var got []portainer.Stack
	require.NoError(t, json.NewDecoder(rr.Body).Decode(&got))

	gotIDs := make([]portainer.StackID, 0, len(got))
	for _, s := range got {
		gotIDs = append(gotIDs, s.ID)
	}
	assert.Equal(t, []portainer.StackID{accessibleStackID}, gotIDs)
}

func TestFilterStacks(t *testing.T) {
	t.Parallel()
	t.Run("filter stacks against particular endpoint and all orphaned stacks", func(t *testing.T) {
		stacks := []portainer.Stack{
			{ID: 1, EndpointID: 3, Name: "normal_stack", Type: portainer.DockerComposeStack},
			{ID: 2, EndpointID: 4, Name: "orphaned_stack", Type: portainer.DockerComposeStack},
			{ID: 3, EndpointID: 5, Name: "other_stack", Type: portainer.DockerComposeStack},
		}
		filters := &stackListOperationFilters{EndpointID: 3, IncludeOrphanedStacks: true}
		endpoints := []portainer.Endpoint{{ID: 3}, {ID: 5}}

		expectStacks := []portainer.Stack{{ID: 1}, {ID: 2}}
		actualStacks := filterStacks(stacks, filters, endpoints)

		isEqualStacks(t, expectStacks, actualStacks)
	})

	t.Run("filter unique stacks against particular endpoint and all orphaned stacks and an orphaned stack has the same name with normal stack", func(t *testing.T) {
		stacks := []portainer.Stack{
			{ID: 1, EndpointID: 3, Name: "normal_stack", Type: portainer.DockerComposeStack},
			{ID: 2, EndpointID: 4, Name: "orphaned_stack", Type: portainer.DockerComposeStack},
			{ID: 3, EndpointID: 5, Name: "other_stack", Type: portainer.DockerComposeStack},
			{ID: 4, EndpointID: 4, Name: "normal_stack", Type: portainer.DockerComposeStack},
		}
		filters := &stackListOperationFilters{EndpointID: 3, IncludeOrphanedStacks: true}
		endpoints := []portainer.Endpoint{{ID: 3}, {ID: 5}}

		expectStacks := []portainer.Stack{{ID: 1}, {ID: 2}}
		actualStacks := filterStacks(stacks, filters, endpoints)

		isEqualStacks(t, expectStacks, actualStacks)
	})

	t.Run("only filter stacks against particular endpoint and no orphaned stacks", func(t *testing.T) {
		stacks := []portainer.Stack{
			{ID: 1, EndpointID: 3, Name: "normal_stack", Type: portainer.DockerComposeStack},
			{ID: 2, EndpointID: 4, Name: "orphaned_stack", Type: portainer.DockerComposeStack},
			{ID: 3, EndpointID: 5, Name: "other_stack", Type: portainer.DockerComposeStack},
			{ID: 4, EndpointID: 4, Name: "normal_stack", Type: portainer.DockerComposeStack},
		}
		filters := &stackListOperationFilters{EndpointID: 3, IncludeOrphanedStacks: false}
		endpoints := []portainer.Endpoint{{ID: 3}, {ID: 5}}

		expectStacks := []portainer.Stack{{ID: 1}}
		actualStacks := filterStacks(stacks, filters, endpoints)

		isEqualStacks(t, expectStacks, actualStacks)
	})
}

func isEqualStacks(t *testing.T, expectStacks, actualStacks []portainer.Stack) {
	expectStackIDs := make([]int, len(expectStacks))
	for i, stack := range expectStacks {
		expectStackIDs[i] = int(stack.ID)
	}
	sort.Ints(expectStackIDs)

	actualStackIDs := make([]int, len(actualStacks))
	for i, stack := range actualStacks {
		actualStackIDs[i] = int(stack.ID)
	}
	sort.Ints(actualStackIDs)

	assert.Equal(t, expectStackIDs, actualStackIDs)
}
