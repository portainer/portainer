package users

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/apikey"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/demo"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/jwt"
	"github.com/stretchr/testify/assert"
)

func Test_userList(t *testing.T) {
	is := assert.New(t)

	_, store, teardown := datastore.MustNewTestStore(t, true, true)
	defer teardown()

	// create admin and standard user(s)
	adminUser := &portainer.User{ID: 1, Username: "admin", Role: portainer.AdministratorRole}
	err := store.User().Create(adminUser)
	is.NoError(err, "error creating admin user")

	// setup services
	jwtService, err := jwt.NewService("1h", store)
	is.NoError(err, "Error initiating jwt service")
	apiKeyService := apikey.NewAPIKeyService(store.APIKeyRepository(), store.User())
	requestBouncer := security.NewRequestBouncer(store, jwtService, apiKeyService)
	rateLimiter := security.NewRateLimiter(10, 1*time.Second, 1*time.Hour)
	passwordChecker := security.NewPasswordStrengthChecker(store.SettingsService)

	h := NewHandler(requestBouncer, rateLimiter, apiKeyService, &demo.Service{}, passwordChecker)
	h.DataStore = store

	// generate admin user tokens
	adminJWT, _ := jwtService.GenerateToken(&portainer.TokenData{ID: adminUser.ID, Username: adminUser.Username, Role: adminUser.Role})

	// Case 1: the user is given the endpoint access directly
	userWithEndpointAccess := &portainer.User{ID: 2, Username: "standard-user-with-endpoint-access", Role: portainer.StandardUserRole, PortainerAuthorizations: authorization.DefaultPortainerAuthorizations()}
	err = store.User().Create(userWithEndpointAccess)
	is.NoError(err, "error creating user")

	userWithoutEndpointAccess := &portainer.User{ID: 3, Username: "standard-user-without-endpoint-access", Role: portainer.StandardUserRole, PortainerAuthorizations: authorization.DefaultPortainerAuthorizations()}
	err = store.User().Create(userWithoutEndpointAccess)
	is.NoError(err, "error creating user")

	// create environment group
	endpointGroup := &portainer.EndpointGroup{ID: 1, Name: "default-endpoint-group"}
	err = store.EndpointGroup().Create(endpointGroup)
	is.NoError(err, "error creating endpoint group")

	// create endpoint and user access policies
	userAccessPolicies := make(portainer.UserAccessPolicies, 0)
	userAccessPolicies[userWithEndpointAccess.ID] = portainer.AccessPolicy{RoleID: portainer.RoleID(userWithEndpointAccess.Role)}

	endpointWithUserAccessPolicy := &portainer.Endpoint{ID: 1, UserAccessPolicies: userAccessPolicies, GroupID: endpointGroup.ID}
	err = store.Endpoint().Create(endpointWithUserAccessPolicy)
	is.NoError(err, "error creating endpoint")

	jwt, _ := jwtService.GenerateToken(&portainer.TokenData{ID: userWithEndpointAccess.ID, Username: userWithEndpointAccess.Username, Role: userWithEndpointAccess.Role})

	t.Run("admin user can successfully list all users", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/users", nil)
		req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", adminJWT))

		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)

		is.Equal(http.StatusOK, rr.Code)

		body, err := io.ReadAll(rr.Body)
		is.NoError(err, "ReadAll should not return error")

		var resp []portainer.User
		err = json.Unmarshal(body, &resp)
		is.NoError(err, "response should be list json")

		is.Len(resp, 3)
	})

	t.Run("admin user can list users who are given the endpoint access directly", func(t *testing.T) {
		params := url.Values{}
		params.Add("environmentId", fmt.Sprintf("%d", endpointWithUserAccessPolicy.ID))
		req := httptest.NewRequest(http.MethodGet, "/users?"+params.Encode(), nil)
		req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", adminJWT))

		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)

		is.Equal(http.StatusOK, rr.Code)

		body, err := io.ReadAll(rr.Body)
		is.NoError(err, "ReadAll should not return error")

		var resp []portainer.User
		err = json.Unmarshal(body, &resp)
		is.NoError(err, "response should be list json")

		is.Len(resp, 1)
		if len(resp) == 1 {
			is.Equal(userWithEndpointAccess.ID, resp[0].ID)
		}
	})

	t.Run("standard user cannot list amdin users", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/users", nil)
		req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", jwt))

		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)

		is.Equal(http.StatusOK, rr.Code)

		body, err := io.ReadAll(rr.Body)
		is.NoError(err, "ReadAll should not return error")

		var resp []portainer.User
		err = json.Unmarshal(body, &resp)
		is.NoError(err, "response should be list json")

		is.Len(resp, 2)
		if len(resp) > 0 {
			for _, user := range resp {
				is.NotEqual(portainer.AdministratorRole, user.Role)
			}
		}
	})

	// Case 2: the user is under an environment group and the environment group has endpoint access.
	//         the user inherits the endpoint access from the environment group
	// create user
	userUnderGroup := &portainer.User{ID: 4, Username: "standard-user-under-environment-group", Role: portainer.StandardUserRole, PortainerAuthorizations: authorization.DefaultPortainerAuthorizations()}
	err = store.User().Create(userUnderGroup)
	is.NoError(err, "error creating user")

	// create environment group including a user
	userAccessPoliciesUnderGroup := make(portainer.UserAccessPolicies, 0)
	userAccessPoliciesUnderGroup[userUnderGroup.ID] = portainer.AccessPolicy{RoleID: portainer.RoleID(userUnderGroup.Role)}

	endpointGroupWithUser := &portainer.EndpointGroup{ID: 2, Name: "endpoint-group-with-user", UserAccessPolicies: userAccessPoliciesUnderGroup}
	err = store.EndpointGroup().Create(endpointGroupWithUser)
	is.NoError(err, "error creating endpoint group")

	// create endpoint
	endpointUnderGroupWithUser := &portainer.Endpoint{ID: 2, GroupID: endpointGroupWithUser.ID}
	err = store.Endpoint().Create(endpointUnderGroupWithUser)
	is.NoError(err, "error creating endpoint")

	t.Run("admin user can list users who inherit endpoint access from an environment group", func(t *testing.T) {
		params := url.Values{}
		params.Add("environmentId", fmt.Sprintf("%d", endpointUnderGroupWithUser.ID))
		req := httptest.NewRequest(http.MethodGet, "/users?"+params.Encode(), nil)
		req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", adminJWT))

		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)

		is.Equal(http.StatusOK, rr.Code)

		body, err := io.ReadAll(rr.Body)
		is.NoError(err, "ReadAll should not return error")

		var resp []portainer.User
		err = json.Unmarshal(body, &resp)
		is.NoError(err, "response should be list json")

		is.Len(resp, 1)
		if len(resp) == 1 {
			is.Equal(userUnderGroup.ID, resp[0].ID)
		}
	})

	// Case 3: the user is under a team and the team is under an environment group.
	//		   the environment group is given the endpoint access.
	//		   both user and team should inherits the endpoint access from the environment group
	// create a team including a user
	teamUnderGroup := &portainer.Team{ID: 1, Name: "team-under-environment-group"}
	err = store.Team().Create(teamUnderGroup)
	is.NoError(err, "error creating team")

	userUnderTeam := &portainer.User{ID: 4, Username: "standard-user-under-team", Role: portainer.StandardUserRole, PortainerAuthorizations: authorization.DefaultPortainerAuthorizations()}
	err = store.User().Create(userUnderTeam)
	is.NoError(err, "error creating user")

	teamMembership := &portainer.TeamMembership{ID: 1, UserID: userUnderTeam.ID, TeamID: teamUnderGroup.ID}
	err = store.TeamMembership().Create(teamMembership)
	is.NoError(err, "error creating team membership")

	// create environment group including a team
	teamAccessPoliciesUnderGroup := make(portainer.TeamAccessPolicies, 0)
	teamAccessPoliciesUnderGroup[teamUnderGroup.ID] = portainer.AccessPolicy{RoleID: portainer.RoleID(userUnderTeam.Role)}

	endpointGroupWithTeam := &portainer.EndpointGroup{ID: 3, Name: "endpoint-group-with-team", TeamAccessPolicies: teamAccessPoliciesUnderGroup}
	err = store.EndpointGroup().Create(endpointGroupWithTeam)
	is.NoError(err, "error creating endpoint group")

	// create endpoint
	endpointUnderGroupWithTeam := &portainer.Endpoint{ID: 3, GroupID: endpointGroupWithTeam.ID}
	err = store.Endpoint().Create(endpointUnderGroupWithTeam)
	is.NoError(err, "error creating endpoint")
	t.Run("admin user can list users who inherit endpoint access from a team that inherit from an environment group", func(t *testing.T) {
		params := url.Values{}
		params.Add("environmentId", fmt.Sprintf("%d", endpointUnderGroupWithTeam.ID))
		req := httptest.NewRequest(http.MethodGet, "/users?"+params.Encode(), nil)
		req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", adminJWT))

		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)

		is.Equal(http.StatusOK, rr.Code)

		body, err := io.ReadAll(rr.Body)
		is.NoError(err, "ReadAll should not return error")

		var resp []portainer.User
		err = json.Unmarshal(body, &resp)
		is.NoError(err, "response should be list json")

		is.Len(resp, 1)
		if len(resp) == 1 {
			is.Equal(userUnderTeam.ID, resp[0].ID)
		}
	})

	// Case 4: the user is under a team and the team is given the endpoint access
	//         the user inherits the endpoint access from the team
	// create a team including a user
	teamWithEndpointAccess := &portainer.Team{ID: 2, Name: "team-with-endpoint-access"}
	err = store.Team().Create(teamWithEndpointAccess)
	is.NoError(err, "error creating team")

	userUnderTeamWithEndpointAccess := &portainer.User{ID: 5, Username: "standard-user-under-team-with-endpoint-access", Role: portainer.StandardUserRole, PortainerAuthorizations: authorization.DefaultPortainerAuthorizations()}
	err = store.User().Create(userUnderTeamWithEndpointAccess)
	is.NoError(err, "error creating user")

	teamMembershipWithEndpointAccess := &portainer.TeamMembership{ID: 2, UserID: userUnderTeamWithEndpointAccess.ID, TeamID: teamWithEndpointAccess.ID}
	err = store.TeamMembership().Create(teamMembershipWithEndpointAccess)
	is.NoError(err, "error creating team membership")

	// create environment group
	endpointGroupWithoutTeam := &portainer.EndpointGroup{ID: 4, Name: "endpoint-group-without-team"}
	err = store.EndpointGroup().Create(endpointGroupWithoutTeam)
	is.NoError(err, "error creating endpoint group")

	// create endpoint and team access policies
	teamAccessPolicies := make(portainer.TeamAccessPolicies, 0)
	teamAccessPolicies[teamWithEndpointAccess.ID] = portainer.AccessPolicy{RoleID: portainer.RoleID(userUnderTeamWithEndpointAccess.Role)}

	endpointWithTeamAccessPolicy := &portainer.Endpoint{ID: 4, TeamAccessPolicies: teamAccessPolicies, GroupID: endpointGroupWithoutTeam.ID}
	err = store.Endpoint().Create(endpointWithTeamAccessPolicy)
	is.NoError(err, "error creating endpoint")
	t.Run("admin user can list users who inherit endpoint access from a team", func(t *testing.T) {
		params := url.Values{}
		params.Add("environmentId", fmt.Sprintf("%d", endpointWithTeamAccessPolicy.ID))
		req := httptest.NewRequest(http.MethodGet, "/users?"+params.Encode(), nil)
		req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", adminJWT))

		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)

		is.Equal(http.StatusOK, rr.Code)

		body, err := io.ReadAll(rr.Body)
		is.NoError(err, "ReadAll should not return error")

		var resp []portainer.User
		err = json.Unmarshal(body, &resp)
		is.NoError(err, "response should be list json")

		is.Len(resp, 1)
		if len(resp) == 1 {
			is.Equal(userUnderTeamWithEndpointAccess.ID, resp[0].ID)
		}
	})
}
