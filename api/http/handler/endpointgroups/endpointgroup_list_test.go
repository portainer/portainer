package endpointgroups

import (
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"
	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestHandler_endpointGroupList(t *testing.T) {
	_, store := datastore.MustNewTestStore(t, true, false)
	handler := setUpHandler(t, store)

	groups := setUpGroups(t, store)

	t.Run("with groups, no size flag", func(t *testing.T) {
		w := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodGet, "/endpoint_groups", nil)
		rrc := &security.RestrictedRequestContext{
			IsAdmin: true,
		}
		req = req.WithContext(security.StoreRestrictedRequestContext(req, rrc))

		handler.ServeHTTP(w, req)

		require.Equal(t, http.StatusOK, w.Code)
		res := make([]EndpointGroupResponse, 0)
		require.NoError(t, json.NewDecoder(w.Body).Decode(&res))
		require.Len(t, res, len(groups)+1, "should contain an additional default group")
		for _, group := range res {
			assert.Zero(t, group.Total)
			assert.Zero(t, group.TypeInfo.Docker)
			assert.Zero(t, group.TypeInfo.Kubernetes)
			assert.Zero(t, group.TypeInfo.Podman)
			assert.False(t, group.TypeInfo.Mixed)
		}
	})

	t.Run("with size flag, no endpoints", func(t *testing.T) {
		w := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodGet, "/endpoint_groups?size=true", nil)
		rrc := &security.RestrictedRequestContext{
			IsAdmin: true,
		}
		req = req.WithContext(security.StoreRestrictedRequestContext(req, rrc))

		handler.ServeHTTP(w, req)

		require.Equal(t, http.StatusOK, w.Code)
		res := make([]EndpointGroupResponse, 0)
		require.NoError(t, json.NewDecoder(w.Body).Decode(&res))
		for _, group := range res {
			assert.Zero(t, group.Total)
		}
	})

	t.Run("with size flag and single docker endpoint", func(t *testing.T) {
		endpoint := &portainer.Endpoint{
			ID:      1,
			GroupID: groups[0].ID,
			Type:    portainer.DockerEnvironment,
		}
		require.NoError(t, store.Endpoint().Create(endpoint))
		t.Cleanup(func() { _ = store.Endpoint().DeleteEndpoint(endpoint.ID) })

		w := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodGet, "/endpoint_groups?size=true", nil)
		rrc := &security.RestrictedRequestContext{
			IsAdmin: true,
		}
		req = req.WithContext(security.StoreRestrictedRequestContext(req, rrc))

		handler.ServeHTTP(w, req)

		require.Equal(t, http.StatusOK, w.Code)
		res := make([]EndpointGroupResponse, 0)
		require.NoError(t, json.NewDecoder(w.Body).Decode(&res))

		var group1 *EndpointGroupResponse
		for i := range res {
			if res[i].ID == groups[0].ID {
				group1 = &res[i]
				break
			}
		}
		require.NotNil(t, group1)
		assert.Equal(t, 1, group1.Total)
		assert.Equal(t, 1, group1.TypeInfo.Docker)
		assert.Equal(t, 0, group1.TypeInfo.Kubernetes)
		assert.Equal(t, 0, group1.TypeInfo.Podman)
		assert.False(t, group1.TypeInfo.Mixed)
	})

	t.Run("with mixed endpoint types", func(t *testing.T) {
		dockerEndpoint := &portainer.Endpoint{
			ID:      2,
			GroupID: groups[1].ID,
			Type:    portainer.DockerEnvironment,
		}
		require.NoError(t, store.Endpoint().Create(dockerEndpoint))
		t.Cleanup(func() { _ = store.Endpoint().DeleteEndpoint(dockerEndpoint.ID) })

		k8sEndpoint := &portainer.Endpoint{
			ID:      3,
			GroupID: groups[1].ID,
			Type:    portainer.KubernetesLocalEnvironment,
		}
		require.NoError(t, store.Endpoint().Create(k8sEndpoint))
		t.Cleanup(func() { _ = store.Endpoint().DeleteEndpoint(k8sEndpoint.ID) })

		w := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodGet, "/endpoint_groups?size=true", nil)
		rrc := &security.RestrictedRequestContext{
			IsAdmin: true,
		}
		req = req.WithContext(security.StoreRestrictedRequestContext(req, rrc))

		handler.ServeHTTP(w, req)

		require.Equal(t, http.StatusOK, w.Code)
		res := make([]EndpointGroupResponse, 0)
		require.NoError(t, json.NewDecoder(w.Body).Decode(&res))

		var group2 *EndpointGroupResponse
		for i := range res {
			if res[i].ID == groups[1].ID {
				group2 = &res[i]
				break
			}
		}
		require.NotNil(t, group2)
		assert.Equal(t, 2, group2.Total)
		assert.Equal(t, 1, group2.TypeInfo.Docker)
		assert.Equal(t, 1, group2.TypeInfo.Kubernetes)
		assert.Equal(t, 0, group2.TypeInfo.Podman)
		assert.True(t, group2.TypeInfo.Mixed, "should be marked as mixed when multiple types exist")
	})

	t.Run("with podman endpoint", func(t *testing.T) {
		dockerEndpoint := &portainer.Endpoint{
			ID:      4,
			GroupID: groups[0].ID,
			Type:    portainer.DockerEnvironment,
		}
		require.NoError(t, store.Endpoint().Create(dockerEndpoint))
		t.Cleanup(func() { _ = store.Endpoint().DeleteEndpoint(dockerEndpoint.ID) })

		podmanEndpoint := &portainer.Endpoint{
			ID:              5,
			GroupID:         groups[0].ID,
			Type:            portainer.DockerEnvironment,
			ContainerEngine: portainer.ContainerEnginePodman,
		}
		require.NoError(t, store.Endpoint().Create(podmanEndpoint))
		t.Cleanup(func() { _ = store.Endpoint().DeleteEndpoint(podmanEndpoint.ID) })

		w := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodGet, "/endpoint_groups?size=true", nil)
		rrc := &security.RestrictedRequestContext{
			IsAdmin: true,
		}
		req = req.WithContext(security.StoreRestrictedRequestContext(req, rrc))

		handler.ServeHTTP(w, req)

		require.Equal(t, http.StatusOK, w.Code)
		res := make([]EndpointGroupResponse, 0)
		require.NoError(t, json.NewDecoder(w.Body).Decode(&res))

		var group1 *EndpointGroupResponse
		for i := range res {
			if res[i].ID == groups[0].ID {
				group1 = &res[i]
				break
			}
		}
		require.NotNil(t, group1)
		assert.Equal(t, 2, group1.Total)
		assert.Equal(t, 1, group1.TypeInfo.Docker)
		assert.Equal(t, 0, group1.TypeInfo.Kubernetes)
		assert.Equal(t, 1, group1.TypeInfo.Podman)
		assert.True(t, group1.TypeInfo.Mixed)
	})
}

func setUpGroups(t *testing.T, store *datastore.Store) []portainer.EndpointGroup {
	group1 := &portainer.EndpointGroup{
		ID:   1,
		Name: "Group 1",
	}
	group2 := &portainer.EndpointGroup{
		ID:   2,
		Name: "Group 2",
	}
	require.NoError(t, store.EndpointGroup().Create(group1))
	require.NoError(t, store.EndpointGroup().Create(group2))

	return []portainer.EndpointGroup{*group1, *group2}
}
