package teammemberships

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/testhelpers"

	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/require"
)

func TestUpdate(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, false)

	err := store.TeamMembershipService.Create(&portainer.TeamMembership{
		UserID: 3,
		TeamID: 3,
		Role:   1,
	})
	require.NoError(t, err)

	h := NewHandler(testhelpers.NewTestRequestBouncer())
	h.DataStore = store

	payload := `{"UserID": 3, "TeamID": 2, "Role": 1}`

	rr := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPut, "/team_memberships/1", strings.NewReader(payload))

	restrictedCtx := &security.RestrictedRequestContext{IsAdmin: true}
	r = r.WithContext(security.StoreRestrictedRequestContext(r, restrictedCtx))

	h.ServeHTTP(rr, r)

	require.Equal(t, http.StatusOK, rr.Code)

	var updatedMembership portainer.TeamMembership
	err = json.Unmarshal(rr.Body.Bytes(), &updatedMembership)
	require.NoError(t, err)

	require.Equal(t, portainer.UserID(3), updatedMembership.UserID)
	require.Equal(t, portainer.TeamID(2), updatedMembership.TeamID)
	require.Equal(t, portainer.MembershipRole(1), updatedMembership.Role)
}
