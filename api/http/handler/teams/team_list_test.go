package teams

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/apikey"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/jwt"
	"github.com/stretchr/testify/assert"
)

func Test_teamList(t *testing.T) {
	is := assert.New(t)

	_, store, teardown := datastore.MustNewTestStore(t, true, true)
	defer teardown()

	// create admin
	adminUser := &portainer.User{ID: 1, Username: "admin", Role: portainer.AdministratorRole}
	err := store.User().Create(adminUser)
	is.NoError(err, "error creating admin user")

	// setup services
	jwtService, err := jwt.NewService("1h", store)
	is.NoError(err, "Error initiating jwt service")
	apiKeyService := apikey.NewAPIKeyService(store.APIKeyRepository(), store.User())
	requestBouncer := security.NewRequestBouncer(store, jwtService, apiKeyService)

	h := NewHandler(requestBouncer)
	h.DataStore = store

	// generate admin user tokens
	adminJWT, _ := jwtService.GenerateToken(&portainer.TokenData{ID: adminUser.ID, Username: adminUser.Username, Role: adminUser.Role})

	// Case 1: the team is given the endpoint access directly
	// create teams
	teamWithEndpointAccess := &portainer.Team{ID: 1, Name: "team-with-endpoint-access"}
	err = store.Team().Create(teamWithEndpointAccess)
	is.NoError(err, "error creating team")

	teamWithoutEndpointAccess := &portainer.Team{ID: 2, Name: "team-without-endpoint-access"}
	err = store.Team().Create(teamWithoutEndpointAccess)
	is.NoError(err, "error creating team")

	// create users
	userWithEndpointAccessByTeam := &portainer.User{ID: 2, Username: "standard-user-inherit-endpoint-access-from-team", Role: portainer.StandardUserRole, PortainerAuthorizations: authorization.DefaultPortainerAuthorizations()}
	err = store.User().Create(userWithEndpointAccessByTeam)
	is.NoError(err, "error creating user")

	userWithoutEndpointAccess := &portainer.User{ID: 3, Username: "standard-user-without-endpoint-access", Role: portainer.StandardUserRole, PortainerAuthorizations: authorization.DefaultPortainerAuthorizations()}
	err = store.User().Create(userWithoutEndpointAccess)
	is.NoError(err, "error creating user")

	// create team membership
	teamMembership := &portainer.TeamMembership{ID: 1, UserID: userWithEndpointAccessByTeam.ID, TeamID: teamWithEndpointAccess.ID}
	err = store.TeamMembership().Create(teamMembership)
	is.NoError(err, "error creating team membership")

	// create endpoint and team access policies
	teamAccessPolicies := make(portainer.TeamAccessPolicies, 0)
	teamAccessPolicies[teamWithEndpointAccess.ID] = portainer.AccessPolicy{RoleID: portainer.RoleID(userWithEndpointAccessByTeam.Role)}

	endpointGroupOnly := &portainer.EndpointGroup{ID: 5, Name: "endpoint-group"}
	err = store.EndpointGroup().Create(endpointGroupOnly)
	is.NoError(err, "error creating endpoint group")

	endpointWithTeamAccessPolicy := &portainer.Endpoint{ID: 1, GroupID: endpointGroupOnly.ID, TeamAccessPolicies: teamAccessPolicies}
	err = store.Endpoint().Create(endpointWithTeamAccessPolicy)
	is.NoError(err, "error creating endpoint")

	jwt, _ := jwtService.GenerateToken(&portainer.TokenData{ID: userWithEndpointAccessByTeam.ID, Username: userWithEndpointAccessByTeam.Username, Role: userWithEndpointAccessByTeam.Role})

	t.Run("admin user can successfully list all teams", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/teams", nil)
		req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", adminJWT))

		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)

		is.Equal(http.StatusOK, rr.Code)

		body, err := io.ReadAll(rr.Body)
		is.NoError(err, "ReadAll should not return error")

		var resp []portainer.Team
		err = json.Unmarshal(body, &resp)
		is.NoError(err, "response should be list json")

		is.Len(resp, 2)
	})

	t.Run("admin user can list team who is given access to the specific endpoint", func(t *testing.T) {
		params := url.Values{}
		params.Add("environmentId", fmt.Sprintf("%d", endpointWithTeamAccessPolicy.ID))
		req := httptest.NewRequest(http.MethodGet, "/teams?"+params.Encode(), nil)
		req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", adminJWT))

		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)

		is.Equal(http.StatusOK, rr.Code)

		body, err := io.ReadAll(rr.Body)
		is.NoError(err, "ReadAll should not return error")

		var resp []portainer.Team
		err = json.Unmarshal(body, &resp)
		is.NoError(err, "response should be list json")

		is.Len(resp, 1)
		if len(resp) == 1 {
			is.Equal(teamWithEndpointAccess.ID, resp[0].ID)
		}
	})

	t.Run("standard user only can list team where he belongs to", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/teams", nil)
		req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", jwt))

		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)

		is.Equal(http.StatusOK, rr.Code)

		body, err := io.ReadAll(rr.Body)
		is.NoError(err, "ReadAll should not return error")

		var resp []portainer.Team
		err = json.Unmarshal(body, &resp)
		is.NoError(err, "response should be list json")

		is.Len(resp, 1)
		if len(resp) == 1 {
			is.Equal(teamWithEndpointAccess.ID, resp[0].ID)
		}
	})

	// Case 2: the team is under an environment group and the endpoint group has endpoint access.
	//         the user inherits the endpoint access from the environment group
	// create team
	teamUnderGroup := &portainer.Team{ID: 3, Name: "team-under-environment-group"}
	err = store.Team().Create(teamUnderGroup)
	is.NoError(err, "error creating user")

	// create environment group including a team
	teamAccessPoliciesUnderGroup := make(portainer.TeamAccessPolicies, 0)
	teamAccessPoliciesUnderGroup[teamUnderGroup.ID] = portainer.AccessPolicy{}

	endpointGroupWithTeam := &portainer.EndpointGroup{ID: 2, Name: "endpoint-group-with-team", TeamAccessPolicies: teamAccessPoliciesUnderGroup}
	err = store.EndpointGroup().Create(endpointGroupWithTeam)
	is.NoError(err, "error creating endpoint group")

	// create endpoint
	endpointUnderGroupWithTeam := &portainer.Endpoint{ID: 2, GroupID: endpointGroupWithTeam.ID}
	err = store.Endpoint().Create(endpointUnderGroupWithTeam)
	is.NoError(err, "error creating endpoint")

	t.Run("admin user can list teams who inherit endpoint access from an environment group", func(t *testing.T) {
		params := url.Values{}
		params.Add("environmentId", fmt.Sprintf("%d", endpointUnderGroupWithTeam.ID))
		req := httptest.NewRequest(http.MethodGet, "/teams?"+params.Encode(), nil)
		req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", adminJWT))

		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)

		is.Equal(http.StatusOK, rr.Code)

		body, err := io.ReadAll(rr.Body)
		is.NoError(err, "ReadAll should not return error")

		var resp []portainer.Team
		err = json.Unmarshal(body, &resp)
		is.NoError(err, "response should be list json")

		is.Len(resp, 1)
		if len(resp) == 1 {
			is.Equal(teamUnderGroup.ID, resp[0].ID)
		}
	})
}
