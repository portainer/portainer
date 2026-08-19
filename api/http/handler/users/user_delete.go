package users

import (
	"errors"
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/endpointutils"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/rs/zerolog/log"
)

// @id UserDelete
// @summary Remove a user
// @description Remove a user.
// @description **Access policy**: administrator
// @tags users
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param id path int true "User identifier"
// @success 204 "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied"
// @failure 404 "User not found"
// @failure 500 "Server error"
// @router /users/{id} [delete]
func (handler *Handler) userDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	userID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid user identifier route variable", err)
	}

	if userID == 1 {
		return httperror.Forbidden("Cannot remove the initial admin account", errors.New("Cannot remove the initial admin account"))
	}

	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve user authentication token", err)
	}

	if tokenData.ID == portainer.UserID(userID) {
		return httperror.Forbidden("Cannot remove your own user account. Contact another administrator", errAdminCannotRemoveSelf)
	}

	user, err := handler.DataStore.User().Read(portainer.UserID(userID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find a user with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find a user with the specified identifier inside the database", err)
	}

	if user.Role == portainer.AdministratorRole {
		return handler.deleteAdminUser(w, user)
	}

	return handler.deleteUser(w, user)
}

func (handler *Handler) deleteAdminUser(w http.ResponseWriter, user *portainer.User) *httperror.HandlerError {
	if user.Password == "" {
		return handler.deleteUser(w, user)
	}

	users, err := handler.DataStore.User().ReadAll()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve users from the database", err)
	}

	localAdminCount := 0
	for _, u := range users {
		if u.Role == portainer.AdministratorRole && u.Password != "" {
			localAdminCount++
		}
	}

	if localAdminCount < 2 {
		return httperror.InternalServerError("Cannot remove local administrator user", errCannotRemoveLastLocalAdmin)
	}

	return handler.deleteUser(w, user)
}

func (handler *Handler) deleteUser(w http.ResponseWriter, user *portainer.User) *httperror.HandlerError {
	handler.cleanupUserK8sServiceAccounts(user.ID)

	if err := handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		if err := handler.AuthorizationService.RemoveUserAccessPolicies(tx, user.ID); err != nil {
			return err
		}

		if err := tx.User().Delete(user.ID); err != nil {
			return err
		}

		if err := tx.TeamMembership().DeleteTeamMembershipByUserID(user.ID); err != nil {
			return err
		}

		return nil
	}); err != nil {
		return httperror.InternalServerError("Unable to remove user from the database", err)
	}

	// Remove all of the users persisted API keys
	apiKeys, err := handler.apiKeyService.GetAPIKeys(user.ID)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve user API keys from the database", err)
	}
	for _, k := range apiKeys {
		if err := handler.apiKeyService.DeleteAPIKey(k.ID); err != nil {
			return httperror.InternalServerError("Unable to remove user API key from the database", err)
		}
	}

	return response.Empty(w)
}

func (handler *Handler) cleanupUserK8sServiceAccounts(userID portainer.UserID) {
	if handler.K8sClientFactory == nil {
		return
	}

	var endpoints []portainer.Endpoint
	if err := handler.DataStore.ViewTx(func(tx dataservices.DataStoreTx) error {
		var txErr error
		endpoints, txErr = tx.Endpoint().ReadAll(func(e portainer.Endpoint) bool {
			return endpointutils.IsKubernetesEndpoint(&e)
		})
		return txErr
	}); err != nil {
		log.Error().Err(err).Int("user_id", int(userID)).Msg("failed fetching K8s environments for user cleanup")
		return
	}

	for i := range endpoints {
		kubecli, err := handler.K8sClientFactory.GetPrivilegedKubeClient(&endpoints[i])
		if err != nil {
			log.Error().Err(err).Int("environment_id", int(endpoints[i].ID)).Msg("failed getting kube client for environment")
			continue
		}

		if err := kubecli.RemoveUserServiceAccount(int(userID)); err != nil {
			log.Error().Err(err).Int("environment_id", int(endpoints[i].ID)).Msg("failed removing service account for user")
		}
	}
}
