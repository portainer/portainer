package endpointgroups

import (
	"testing"

	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/internal/testhelpers"
)

func setUpHandler(t *testing.T, store *datastore.Store) *Handler {
	t.Helper()
	handler := NewHandler(testhelpers.NewTestRequestBouncer())
	handler.DataStore = store
	return handler
}
