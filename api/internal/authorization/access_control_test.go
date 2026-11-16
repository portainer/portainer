package authorization

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/set"

	"github.com/stretchr/testify/assert"
)

func TestFilterAuthorizedStacks(t *testing.T) {
	t.Parallel()

	const (
		userID   portainer.UserID     = 1
		teamID   portainer.TeamID     = 5
		endpoint portainer.EndpointID = 1
	)

	accessible := set.ToSet([]portainer.EndpointID{endpoint})

	public := &portainer.ResourceControl{Public: true}
	private := &portainer.ResourceControl{}
	ownedByUser := &portainer.ResourceControl{UserAccesses: []portainer.UserResourceAccess{{UserID: userID}}}
	ownedByTeam := &portainer.ResourceControl{TeamAccesses: []portainer.TeamResourceAccess{{TeamID: teamID}}}

	for _, tc := range []struct {
		name                  string
		accessibleEndpointIDs set.Set[portainer.EndpointID]
		resourceControl       *portainer.ResourceControl
		expectedAuthorized    bool
	}{
		{
			name:               "public stack without environment access",
			resourceControl:    public,
			expectedAuthorized: false,
		},
		{
			name:               "owned stack without environment access",
			resourceControl:    ownedByUser,
			expectedAuthorized: false,
		},
		{
			name:               "team stack without environment access",
			resourceControl:    ownedByTeam,
			expectedAuthorized: false,
		},
		{
			name:                  "public stack with environment access",
			accessibleEndpointIDs: accessible,
			resourceControl:       public,
			expectedAuthorized:    true,
		},
		{
			name:                  "stack owned by the user",
			accessibleEndpointIDs: accessible,
			resourceControl:       ownedByUser,
			expectedAuthorized:    true,
		},
		{
			name:                  "stack owned by the user's team",
			accessibleEndpointIDs: accessible,
			resourceControl:       ownedByTeam,
			expectedAuthorized:    true,
		},
		{
			name:                  "private stack",
			accessibleEndpointIDs: accessible,
			resourceControl:       private,
			expectedAuthorized:    false,
		},
		{
			name:                  "stack without resource control",
			accessibleEndpointIDs: accessible,
			expectedAuthorized:    false,
		},
	} {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			stack := portainer.Stack{ID: 1, EndpointID: endpoint, ResourceControl: tc.resourceControl}

			result := FilterAuthorizedStacks(
				[]portainer.Stack{stack},
				userID,
				[]portainer.TeamID{teamID},
				tc.accessibleEndpointIDs,
			)

			assert.Equal(t, tc.expectedAuthorized, len(result) == 1)
		})
	}
}
