package endpointgroups

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/portainer/portainer/api/datastore"
	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestHandler_endpointGroupUpdate_UnassignedGroupName(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name         string
		currentName  string
		payloadName  string
		expectedCode int
		expectedName string
	}{
		{name: "rename is forbidden", currentName: "Unassigned", payloadName: "K8S Prod", expectedCode: http.StatusForbidden, expectedName: "Unassigned"},
		{name: "unchanged name is allowed", currentName: "Unassigned", payloadName: "Unassigned", expectedCode: http.StatusOK, expectedName: "Unassigned"},
		{name: "empty name is allowed", currentName: "Unassigned", payloadName: "", expectedCode: http.StatusOK, expectedName: "Unassigned"},
		{name: "existing custom name cannot be kept", currentName: "K8S Prod", payloadName: "K8S Prod", expectedCode: http.StatusForbidden, expectedName: "K8S Prod"},
		{name: "existing custom name can be reset", currentName: "K8S Prod", payloadName: "Unassigned", expectedCode: http.StatusOK, expectedName: "Unassigned"},
		{name: "existing custom name cannot change to another", currentName: "K8S Prod", payloadName: "Other", expectedCode: http.StatusForbidden, expectedName: "K8S Prod"},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			_, store := datastore.MustNewTestStore(t, true, false)
			handler := setUpHandler(t, store)

			group, err := store.EndpointGroup().Read(unassignedGroupID)
			require.NoError(t, err)
			group.Name = tc.currentName
			require.NoError(t, store.EndpointGroup().Update(group.ID, group))

			description := "updated"
			body, err := json.Marshal(endpointGroupUpdatePayload{Name: tc.payloadName, Description: &description})
			require.NoError(t, err)

			req := httptest.NewRequest(http.MethodPut, "/endpoint_groups/1", bytes.NewBuffer(body))
			w := httptest.NewRecorder()
			handler.ServeHTTP(w, req)

			assert.Equal(t, tc.expectedCode, w.Code)

			saved, err := store.EndpointGroup().Read(unassignedGroupID)
			require.NoError(t, err)
			assert.Equal(t, tc.expectedName, saved.Name)
		})
	}
}
