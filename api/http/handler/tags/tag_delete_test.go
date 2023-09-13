package tags

import (
	"net/http"
	"net/http/httptest"
	"strconv"
	"sync"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/internal/testhelpers"
)

func TestTagDeleteEdgeGroupsConcurrently(t *testing.T) {
	const tagsCount = 100

	_, store := datastore.MustNewTestStore(t, true, false)

	user := &portainer.User{ID: 2, Username: "admin", Role: portainer.AdministratorRole}
	err := store.User().Create(user)
	if err != nil {
		t.Fatal("could not create admin user:", err)
	}

	handler := NewHandler(testhelpers.NewTestRequestBouncer())
	handler.DataStore = store

	// Create all the tags and add them to the same edge group

	var tagIDs []portainer.TagID

	for i := 0; i < tagsCount; i++ {
		tagID := portainer.TagID(i) + 1

		err = store.Tag().Create(&portainer.Tag{
			ID:   tagID,
			Name: "tag-" + strconv.Itoa(int(tagID)),
		})
		if err != nil {
			t.Fatal("could not create tag:", err)
		}

		tagIDs = append(tagIDs, tagID)
	}

	err = store.EdgeGroup().Create(&portainer.EdgeGroup{
		ID:     1,
		Name:   "edgegroup-1",
		TagIDs: tagIDs,
	})
	if err != nil {
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
