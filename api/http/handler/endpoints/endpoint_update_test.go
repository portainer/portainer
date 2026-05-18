package endpoints

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/testhelpers"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_endpointPut_TLSRejectedForEdgeEndpoint(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, true, true)

	h := NewHandler(testhelpers.NewTestRequestBouncer())
	h.DataStore = store

	testCases := []struct {
		name         string
		endpointType portainer.EndpointType
	}{
		{
			name:         "edge agent on docker rejects TLS",
			endpointType: portainer.EdgeAgentOnDockerEnvironment,
		},
		{
			name:         "edge agent on kubernetes rejects TLS",
			endpointType: portainer.EdgeAgentOnKubernetesEnvironment,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			endpointID := portainer.EndpointID(store.Endpoint().GetNextIdentifier())
			err := store.Endpoint().Create(&portainer.Endpoint{
				ID:   endpointID,
				Type: tc.endpointType,
			})
			require.NoError(t, err)

			payload := &endpointUpdatePayload{TLS: new(true)}
			bodyJSON, err := json.Marshal(payload)
			require.NoError(t, err)

			url := fmt.Sprintf("/endpoints/%d", endpointID)
			req := httptest.NewRequest(http.MethodPut, url, bytes.NewBuffer(bodyJSON))
			rctx := security.StoreTokenData(req, &portainer.TokenData{ID: 1, Username: "admin", Role: portainer.AdministratorRole})
			req = req.WithContext(rctx)
			req.Header.Set("Content-Type", "application/json")

			rr := httptest.NewRecorder()
			h.ServeHTTP(rr, req)

			assert.Equal(t, http.StatusBadRequest, rr.Code)
		})
	}
}
