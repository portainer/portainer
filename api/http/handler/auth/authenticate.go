package auth

import (
	"log"
	"net/http"
	"strings"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

type authenticatePayload struct {
	Username string
	Password string
}

type authenticateResponse struct {
	JWT string `json:"jwt"`
}

func (payload *authenticatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Username) {
		return portainer.Error("Invalid username")
	}
	if govalidator.IsNull(payload.Password) {
		return portainer.Error("Invalid password")
	}
	return nil
}

func (handler *Handler) authenticate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	if handler.authDisabled {
		return &httperror.HandlerError{http.StatusServiceUnavailable, "Cannot authenticate user. Portainer was started with the --no-auth flag", ErrAuthDisabled}
	}

	var payload authenticatePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	settings, err := handler.SettingsService.Settings()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve settings from the database", err}
	}

	u, err := handler.UserService.UserByUsername(payload.Username)
	if err != nil && err != portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve a user with the specified username from the database", err}
	}

	if err == portainer.ErrObjectNotFound && settings.AuthenticationMethod == portainer.AuthenticationInternal {
		return &httperror.HandlerError{http.StatusUnprocessableEntity, "Invalid credentials", portainer.ErrUnauthorized}
	}

	if settings.AuthenticationMethod == portainer.AuthenticationLDAP {
		if u == nil && settings.LDAPSettings.AutoCreateUsers {
			return handler.authenticateLDAPAndCreateUser(w, payload.Username, payload.Password, &settings.LDAPSettings)
		} else if u == nil && !settings.LDAPSettings.AutoCreateUsers {
			return &httperror.HandlerError{http.StatusUnprocessableEntity, "Invalid credentials", portainer.ErrUnauthorized}
		}
		return handler.authenticateLDAP(w, u, payload.Password, &settings.LDAPSettings)
	}

	return handler.authenticateInternal(w, u, payload.Password)
}

func (handler *Handler) authenticateLDAP(w http.ResponseWriter, user *portainer.User, password string, ldapSettings *portainer.LDAPSettings) *httperror.HandlerError {
	err := handler.LDAPService.AuthenticateUser(user.Username, password, ldapSettings)
	if err != nil {
		return handler.authenticateInternal(w, user, password)
	}

	err = handler.addUserIntoTeams(user, ldapSettings)
	if err != nil {
		log.Printf("Warning: unable to automatically add user into teams: %s\n", err.Error())
	}

	return handler.writeToken(w, user)
}

func (handler *Handler) authenticateInternal(w http.ResponseWriter, user *portainer.User, password string) *httperror.HandlerError {
	err := handler.CryptoService.CompareHashAndData(user.Password, password)
	if err != nil {
		return &httperror.HandlerError{http.StatusUnprocessableEntity, "Invalid credentials", portainer.ErrUnauthorized}
	}

	return handler.writeToken(w, user)
}

func (handler *Handler) authenticateLDAPAndCreateUser(w http.ResponseWriter, username, password string, ldapSettings *portainer.LDAPSettings) *httperror.HandlerError {
	err := handler.LDAPService.AuthenticateUser(username, password, ldapSettings)
	if err != nil {
		return &httperror.HandlerError{http.StatusUnprocessableEntity, "Invalid credentials", err}
	}

	user := &portainer.User{
		Username: username,
		Role:     portainer.StandardUserRole,
	}

	err = handler.UserService.CreateUser(user)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist user inside the database", err}
	}

	err = handler.addUserIntoTeams(user, ldapSettings)
	if err != nil {
		log.Printf("Warning: unable to automatically add user into teams: %s\n", err.Error())
	}

	return handler.writeToken(w, user)
}

func (handler *Handler) writeToken(w http.ResponseWriter, user *portainer.User) *httperror.HandlerError {
	tokenData := &portainer.TokenData{
		ID:                      user.ID,
		Username:                user.Username,
		Role:                    user.Role,
		PortainerAuthorizations: user.PortainerAuthorizations,
	}

	_, err := handler.ExtensionService.Extension(portainer.RBACExtension)
	if err == portainer.ErrObjectNotFound {
		return handler.persistAndWriteToken(w, tokenData)
	} else if err != nil {
		//httperror.WriteError(w, http.StatusInternalServerError, "", err)
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a extension with the specified identifier inside the database", err}
	}

	endpointAuthorizations, err := handler.getAuthorizations(user)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve authorizations associated to the user", err}
	}
	tokenData.EndpointAuthorizations = endpointAuthorizations

	return handler.persistAndWriteToken(w, tokenData)
}

// TODO: relocate this code?
// Use elispsis via ... ? a,b,c,d... unlimited authorizations parameters
func intersection(a, b portainer.Authorizations) portainer.Authorizations {
	c := make(map[portainer.Authorization]bool)

	for k := range b {
		if _, ok := a[k]; ok {
			c[k] = true
		}
	}
	return c
}

func (handler *Handler) getAuthorizations(user *portainer.User) (portainer.EndpointAuthorizations, error) {
	endpointAuthorizations := make(portainer.EndpointAuthorizations)

	if user.Role == portainer.AdministratorRole {
		return endpointAuthorizations, nil
	}

	userMemberships, err := handler.TeamMembershipService.TeamMembershipsByUserID(user.ID)
	if err != nil {
		return endpointAuthorizations, err
	}

	endpoints, err := handler.EndpointService.Endpoints()
	if err != nil {
		return endpointAuthorizations, err
	}

	// TODO: refactor/cleanup
	endpointGroups, err := handler.EndpointGroupService.EndpointGroups()
	if err != nil {
		return endpointAuthorizations, err
	}

	groupUserAccessPolicies := map[portainer.EndpointGroupID]portainer.UserAccessPolicies{}
	groupTeamAccessPolicies := map[portainer.EndpointGroupID]portainer.TeamAccessPolicies{}
	for _, endpointGroup := range endpointGroups {
		groupUserAccessPolicies[endpointGroup.ID] = endpointGroup.UserAccessPolicies
		groupTeamAccessPolicies[endpointGroup.ID] = endpointGroup.TeamAccessPolicies
	}

	for _, endpoint := range endpoints {
		var roleIdentifiers []portainer.RoleID

		// potential user override
		// should be checked first and break for optimization
		// then check teams if no override found
		policy, ok := endpoint.UserAccessPolicies[user.ID]
		if ok {
			roleIdentifiers = append(roleIdentifiers, policy.RoleID)
		}

		// if no roles on user level, check at group level
		if len(groupUserAccessPolicies[endpoint.GroupID]) > 0 {
			policy, ok := groupUserAccessPolicies[endpoint.GroupID][user.ID]
			if ok {
				roleIdentifiers = append(roleIdentifiers, policy.RoleID)
			}
			// break if found?
		}

		if len(groupTeamAccessPolicies[endpoint.GroupID]) > 0 {
			for _, membership := range userMemberships {
				policy, ok := groupTeamAccessPolicies[endpoint.GroupID][membership.TeamID]
				if ok {
					// endpointAccess
					// Potential multiple team access
					roleIdentifiers = append(roleIdentifiers, policy.RoleID)
				}
			}
			// break if found?
		}

		// if no roles on user level nor group level, check at team level
		if len(roleIdentifiers) == 0 {
			for _, membership := range userMemberships {
				policy, ok := endpoint.TeamAccessPolicies[membership.TeamID]
				if ok {
					// endpointAccess
					// Potential multiple team access
					roleIdentifiers = append(roleIdentifiers, policy.RoleID)
				}
			}
		}

		authorizations, err := handler.getEndpointAuthorizations(roleIdentifiers)
		if err != nil {
			return endpointAuthorizations, err
		}
		endpointAuthorizations[endpoint.ID] = authorizations
	}

	return endpointAuthorizations, nil
}

func (handler *Handler) getEndpointAuthorizations(roleIdentifiers []portainer.RoleID) (portainer.Authorizations, error) {
	var roleAuthorizations []portainer.Authorizations
	for _, id := range roleIdentifiers {
		role, err := handler.RoleService.Role(portainer.RoleID(id))
		if err != nil {
			return nil, err
		}

		roleAuthorizations = append(roleAuthorizations, role.Authorizations)
	}

	var processedAuthorizations portainer.Authorizations
	if len(roleAuthorizations) > 0 {
		processedAuthorizations = roleAuthorizations[0]
		for idx, authorizations := range roleAuthorizations {
			if idx == 0 {
				continue
			}
			processedAuthorizations = intersection(processedAuthorizations, authorizations)
		}
	}

	return processedAuthorizations, nil
}

func (handler *Handler) persistAndWriteToken(w http.ResponseWriter, tokenData *portainer.TokenData) *httperror.HandlerError {
	token, err := handler.JWTService.GenerateToken(tokenData)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to generate JWT token", err}
	}

	return response.JSON(w, &authenticateResponse{JWT: token})
}

func (handler *Handler) addUserIntoTeams(user *portainer.User, settings *portainer.LDAPSettings) error {
	teams, err := handler.TeamService.Teams()
	if err != nil {
		return err
	}

	userGroups, err := handler.LDAPService.GetUserGroups(user.Username, settings)
	if err != nil {
		return err
	}

	userMemberships, err := handler.TeamMembershipService.TeamMembershipsByUserID(user.ID)
	if err != nil {
		return err
	}

	for _, team := range teams {
		if teamExists(team.Name, userGroups) {

			if teamMembershipExists(team.ID, userMemberships) {
				continue
			}

			membership := &portainer.TeamMembership{
				UserID: user.ID,
				TeamID: team.ID,
				Role:   portainer.TeamMember,
			}

			err := handler.TeamMembershipService.CreateTeamMembership(membership)
			if err != nil {
				return err
			}
		}
	}
	return nil
}

func teamExists(teamName string, ldapGroups []string) bool {
	for _, group := range ldapGroups {
		if strings.ToLower(group) == strings.ToLower(teamName) {
			return true
		}
	}
	return false
}

func teamMembershipExists(teamID portainer.TeamID, memberships []portainer.TeamMembership) bool {
	for _, membership := range memberships {
		if membership.TeamID == teamID {
			return true
		}
	}
	return false
}
