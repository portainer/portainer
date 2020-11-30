package users

import (
	"errors"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	bolterrors "github.com/portainer/portainer/api/bolt/errors"
	"github.com/portainer/portainer/api/http/security"
)

// DELETE request on /api/users/:id
func (handler *Handler) userDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	userID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid user identifier route variable", err}
	}

	if userID == 1 {
		return &httperror.HandlerError{http.StatusForbidden, "Cannot remove the initial admin account", errors.New("Cannot remove the initial admin account")}
	}

	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve user authentication token", err}
	}

	if tokenData.ID == portainer.UserID(userID) {
		return &httperror.HandlerError{http.StatusForbidden, "Cannot remove your own user account. Contact another administrator", errAdminCannotRemoveSelf}
	}

	user, err := handler.DataStore.User().User(portainer.UserID(userID))
	if err == bolterrors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a user with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a user with the specified identifier inside the database", err}
	}

	if user.Role == portainer.AdministratorRole {
		return handler.deleteAdminUser(w, user)
	}

	handler.AuthorizationService.TriggerUserAuthUpdate(int(user.ID))

	return handler.deleteUser(w, user)
}

func (handler *Handler) deleteAdminUser(w http.ResponseWriter, user *portainer.User) *httperror.HandlerError {
	if user.Password == "" {
		return handler.deleteUser(w, user)
	}

	users, err := handler.DataStore.User().Users()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve users from the database", err}
	}

	localAdminCount := 0
	for _, u := range users {
		if u.Role == portainer.AdministratorRole && u.Password != "" {
			localAdminCount++
		}
	}

	if localAdminCount < 2 {
		return &httperror.HandlerError{http.StatusInternalServerError, "Cannot remove local administrator user", errCannotRemoveLastLocalAdmin}
	}

	return handler.deleteUser(w, user)
}

func (handler *Handler) deleteUser(w http.ResponseWriter, user *portainer.User) *httperror.HandlerError {
	err := handler.DataStore.User().DeleteUser(user.ID)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove user from the database", err}
	}

	err = handler.DataStore.TeamMembership().DeleteTeamMembershipByUserID(user.ID)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove user memberships from the database", err}
	}

	endpoints, err := handler.DataStore.Endpoint().Endpoints()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to get user endpoint access", err}
	}

	// removes user's k8s service account and all related resources
	for _, endpoint := range endpoints {
		if endpoint.Type != portainer.KubernetesLocalEnvironment &&
			endpoint.Type != portainer.AgentOnKubernetesEnvironment &&
			endpoint.Type != portainer.EdgeAgentOnKubernetesEnvironment {
			continue
		}
		kcl, err := handler.K8sClientFactory.GetKubeClient(&endpoint)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to get k8s endpoint access", err}
		}
		kcl.RemoveUserServiceAccount(int(user.ID))

		accessPolicies, err := kcl.GetNamespaceAccessPolicies()
		if err != nil {
			break
		}

		accessPolicies, hasChange, err := handler.AuthorizationService.RemoveUserNamespaceAccessPolicies(
			int(user.ID), int(endpoint.ID), accessPolicies,
		)
		if hasChange {
			err = kcl.UpdateNamespaceAccessPolicies(accessPolicies)
			if err != nil {
				break
			}
		}
	}

	err = handler.AuthorizationService.RemoveUserAccessPolicies(user.ID)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to clean-up user access policies", err}
	}

	return response.Empty(w)
}
