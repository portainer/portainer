package stacks

import (
	"bytes"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/stretchr/testify/require"
)

func TestStackGitRedeploy_RejectsRebindingToAnotherEnvironment(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, false)

	standardUser := &portainer.User{ID: 2, Username: "standard", Role: portainer.StandardUserRole}
	require.NoError(t, store.User().Create(standardUser))

	allowedEndpoint, err := mockCreateEndpoint(store)
	require.NoError(t, err)

	victimEndpoint := &portainer.Endpoint{ID: 2, Name: "victim", SecuritySettings: allowedEndpoint.SecuritySettings}
	require.NoError(t, store.Endpoint().Create(victimEndpoint))

	victimStack := &portainer.Stack{
		ID:         1,
		Name:       "victim",
		EndpointID: victimEndpoint.ID,
		Type:       portainer.KubernetesStack,
		GitConfig:  &gittypes.RepoConfig{URL: "https://github.com/portainer/portainer.git", ReferenceName: "ref", ConfigHash: "123"},
	}
	require.NoError(t, store.Stack().Create(victimStack))

	handler := NewHandler(testhelpers.NewTestRequestBouncer())
	handler.DataStore = store

	req := httptest.NewRequest(
		http.MethodPut,
		fmt.Sprintf("/stacks/%d/git/redeploy?endpointId=%d", victimStack.ID, allowedEndpoint.ID),
		bytes.NewBufferString("{}"),
	)
	req = req.WithContext(security.StoreRestrictedRequestContext(req, &security.RestrictedRequestContext{
		UserID:          standardUser.ID,
		UserMemberships: []portainer.TeamMembership{},
	}))

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	require.Equal(t, http.StatusForbidden, rr.Code, rr.Body.String())

	stored, err := store.Stack().Read(victimStack.ID)
	require.NoError(t, err)
	require.Equal(t, victimEndpoint.ID, stored.EndpointID, "stack must stay on its own environment")
}
