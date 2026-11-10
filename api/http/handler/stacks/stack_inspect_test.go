package stacks

import (
	"encoding/json"
	"net/http"
	"strconv"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestStackInspect_KubernetesStackNamespaceAccess(t *testing.T) {
	t.Parallel()

	for _, tc := range kubernetesStackAccessCases {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			handler := setupKubernetesStackAccess(t, tc.restrictDefaultNamespace)

			rr := serveAsUser(handler, tc.userID, "/stacks/"+strconv.Itoa(int(tc.stackID)))
			require.Equal(t, tc.expectedStatus, rr.Code, rr.Body.String())

			if tc.expectedStatus != http.StatusOK {
				return
			}

			var resp stackResponse
			require.NoError(t, json.Unmarshal(rr.Body.Bytes(), &resp))
			require.Equal(t, tc.stackID, resp.ID)
		})
	}
}

func TestStackInspect_KubernetesStackDeployedRevision(t *testing.T) {
	t.Parallel()

	for _, tc := range kubernetesStackInspectCases {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			handler := setupKubernetesStackAccess(t, tc.restrictDefaultNamespace)

			rr := serveAsUser(handler, tc.userID, "/stacks/"+strconv.Itoa(int(tc.stackID)))
			require.Equal(t, tc.expectedStatus, rr.Code, rr.Body.String())
		})
	}
}
