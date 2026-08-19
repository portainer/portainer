package tags

import (
	"net/http"
	"net/http/httptest"
	"strconv"
	"sync"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	portainerDsErrors "github.com/portainer/portainer/api/dataservices/errors"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/portainer/portainer/api/roar"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestTagDeleteEdgeGroupsConcurrently(t *testing.T) {
	t.Parallel()
	const tagsCount = 100

	handler, store := setUpHandler(t)
	// Create all the tags and add them to the same edge group

	var tagIDs []portainer.TagID

	for i := range tagsCount {
		tagID := portainer.TagID(i) + 1

		if err := store.Tag().Create(&portainer.Tag{
			ID:   tagID,
			Name: "tag-" + strconv.Itoa(int(tagID)),
		}); err != nil {
			t.Fatal("could not create tag:", err)
		}

		tagIDs = append(tagIDs, tagID)
	}

	if err := store.EdgeGroup().Create(&portainer.EdgeGroup{
		ID:     1,
		Name:   "edgegroup-1",
		TagIDs: tagIDs,
	}); err != nil {
		t.Fatal("could not create edge group:", err)
	}

	// Remove the tags concurrently

	var wg sync.WaitGroup

	wg.Add(len(tagIDs))

	for _, tagID := range tagIDs {
		go func(ID portainer.TagID) {
			defer wg.Done()

			req, err := http.NewRequest(http.MethodDelete, "/tags/"+strconv.Itoa(int(ID)), nil)
			if err != nil {
				t.Fail()
				return
			}

			rec := httptest.NewRecorder()
			handler.ServeHTTP(rec, req)
		}(tagID)
	}

	wg.Wait()

	// Check that the edge group is consistent

	edgeGroup, err := handler.DataStore.EdgeGroup().Read(1)
	if err != nil {
		t.Fatal("could not retrieve the edge group:", err)
	}

	if len(edgeGroup.TagIDs) > 0 {
		t.Fatal("the edge group is not consistent")
	}
}

func TestHandler_tagDelete(t *testing.T) {
	t.Parallel()
	t.Run("should delete tag and update related endpoints and edge groups", func(t *testing.T) {
		handler, store := setUpHandler(t)

		tag := &portainer.Tag{
			ID:             1,
			Name:           "tag-1",
			Endpoints:      make(map[portainer.EndpointID]bool),
			EndpointGroups: make(map[portainer.EndpointGroupID]bool),
		}
		require.NoError(t, store.Tag().Create(tag))

		endpointGroup := &portainer.EndpointGroup{
			ID:     2,
			Name:   "endpoint-group-1",
			TagIDs: []portainer.TagID{tag.ID},
		}
		require.NoError(t, store.EndpointGroup().Create(endpointGroup))

		endpoint1 := &portainer.Endpoint{
			ID:      1,
			Name:    "endpoint-1",
			GroupID: endpointGroup.ID,
		}
		require.NoError(t, store.Endpoint().Create(endpoint1))

		endpoint2 := &portainer.Endpoint{
			ID:     2,
			Name:   "endpoint-2",
			TagIDs: []portainer.TagID{tag.ID},
		}
		require.NoError(t, store.Endpoint().Create(endpoint2))

		tag.Endpoints[endpoint2.ID] = true
		tag.EndpointGroups[endpointGroup.ID] = true
		require.NoError(t, store.Tag().Update(tag.ID, tag))

		dynamicEdgeGroup := &portainer.EdgeGroup{
			ID:      1,
			Name:    "edgegroup-1",
			TagIDs:  []portainer.TagID{tag.ID},
			Dynamic: true,
		}
		require.NoError(t, store.EdgeGroup().Create(dynamicEdgeGroup))

		staticEdgeGroup := &portainer.EdgeGroup{
			ID:          2,
			Name:        "edgegroup-2",
			EndpointIDs: roar.FromSlice([]portainer.EndpointID{endpoint2.ID}),
		}
		require.NoError(t, store.EdgeGroup().Create(staticEdgeGroup))

		req, err := http.NewRequest(http.MethodDelete, "/tags/"+strconv.Itoa(int(tag.ID)), nil)
		if err != nil {
			t.Fail()

			return
		}

		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)

		require.Equal(t, http.StatusNoContent, rec.Code)

		// Check that the tag is deleted
		_, err = store.Tag().Read(tag.ID)
		require.ErrorIs(t, err, portainerDsErrors.ErrObjectNotFound)

		// Check that the endpoints are updated
		endpoint1, err = store.Endpoint().Endpoint(endpoint1.ID)
		require.NoError(t, err)
		assert.Empty(t, endpoint1.TagIDs, "endpoint-1 should not have any tags")
		assert.Equal(t, endpoint1.GroupID, endpointGroup.ID, "endpoint-1 should still belong to the endpoint group")

		endpoint2, err = store.Endpoint().Endpoint(endpoint2.ID)
		require.NoError(t, err)
		assert.Empty(t, endpoint2.TagIDs, "endpoint-2 should not have any tags")

		// Check that the dynamic edge group is updated
		dynamicEdgeGroup, err = store.EdgeGroup().Read(dynamicEdgeGroup.ID)
		require.NoError(t, err)
		assert.Empty(t, dynamicEdgeGroup.TagIDs, "dynamic edge group should not have any tags")
		assert.Equal(t, 0, dynamicEdgeGroup.EndpointIDs.Len(), "dynamic edge group should not have any endpoints")

		// Check that the static edge group is not updated
		staticEdgeGroup, err = store.EdgeGroup().Read(staticEdgeGroup.ID)
		require.NoError(t, err)
		assert.Empty(t, staticEdgeGroup.TagIDs, "static edge group should not have any tags")
		assert.Equal(t, 1, staticEdgeGroup.EndpointIDs.Len(), "static edge group should have one endpoint")
		assert.True(t, staticEdgeGroup.EndpointIDs.Contains(endpoint2.ID), "static edge group should have the endpoint-2")
	})

	// Test the tx.IsErrObjectNotFound logic when endpoint is not found during cleanup
	t.Run("should continue gracefully when endpoint not found during cleanup", func(t *testing.T) {
		_, store := setUpHandler(t)
		// Create a tag with a reference to a non-existent endpoint
		tag := &portainer.Tag{
			ID:             1,
			Name:           "test-tag",
			Endpoints:      map[portainer.EndpointID]bool{999: true}, // Non-existent endpoint
			EndpointGroups: make(map[portainer.EndpointGroupID]bool),
		}

		err := store.Tag().Create(tag)
		require.NoError(t, err)

		err = deleteTag(store, 1)
		require.NoError(t, err)
	})
}

func setUpHandler(t *testing.T) (*Handler, dataservices.DataStore) {
	_, store := datastore.MustNewTestStore(t, true, false)

	user := &portainer.User{ID: 2, Username: "admin", Role: portainer.AdministratorRole}
	if err := store.User().Create(user); err != nil {
		t.Fatal("could not create admin user:", err)
	}

	handler := NewHandler(testhelpers.NewTestRequestBouncer())
	handler.DataStore = store

	return handler, store
}
