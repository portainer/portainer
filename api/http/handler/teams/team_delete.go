package teams

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/internal/endpointutils"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"

	"github.com/pkg/errors"
	"github.com/rs/zerolog/log"
)

// @id TeamDelete
// @summary Remove a team
// @description Remove a team.
// @description **Access policy**: administrator
// @tags teams
// @security ApiKeyAuth
// @security jwt
// @param id path int true "Team Id"
// @success 204 "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied"
// @failure 404 "Team not found"
// @failure 500 "Server error"
// @router /teams/{id} [delete]
func (handler *Handler) teamDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	teamID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid team identifier route variable", err)
	}

	_, err = handler.DataStore.Team().Read(portainer.TeamID(teamID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find a team with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find a team with the specified identifier inside the database", err)
	}

	memberships, err := handler.DataStore.TeamMembership().TeamMembershipsByTeamID(portainer.TeamID(teamID))
	if err != nil {
		return httperror.InternalServerError("Unable to fetch team memberships", err)
	}

	handler.cleanupTeamK8sServiceAccounts(portainer.TeamID(teamID), memberships)

	if err := handler.DataStore.Team().Delete(portainer.TeamID(teamID)); err != nil {
		return httperror.InternalServerError("Unable to delete the team from the database", err)
	}

	if err := handler.DataStore.TeamMembership().DeleteTeamMembershipByTeamID(portainer.TeamID(teamID)); err != nil {
		return httperror.InternalServerError("Unable to delete associated team memberships from the database", err)
	}

	if err := handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return handler.removeTeamAccessPolicies(tx, portainer.TeamID(teamID))
	}); err != nil {
		return httperror.InternalServerError("Unable to clean-up team access policies", err)
	}

	// update default team if deleted team was default
	if err := handler.updateDefaultTeamIfDeleted(portainer.TeamID(teamID)); err != nil {
		return httperror.InternalServerError("Unable to reset default team", err)
	}

	return response.Empty(w)
}

func (handler *Handler) removeTeamAccessPolicies(tx dataservices.DataStoreTx, teamID portainer.TeamID) error {
	endpoints, err := tx.Endpoint().Endpoints()
	if err != nil {
		return err
	}
	for i := range endpoints {
		ep := &endpoints[i]
		if _, hasTeam := ep.TeamAccessPolicies[teamID]; !hasTeam {
			continue
		}

		delete(ep.TeamAccessPolicies, teamID)
		if err := tx.Endpoint().UpdateEndpoint(ep.ID, ep); err != nil {
			return err
		}
	}

	groups, err := tx.EndpointGroup().ReadAll()
	if err != nil {
		return err
	}
	for i := range groups {
		g := &groups[i]
		if _, hasTeam := g.TeamAccessPolicies[teamID]; !hasTeam {
			continue
		}
		delete(g.TeamAccessPolicies, teamID)
		if err := tx.EndpointGroup().Update(g.ID, g); err != nil {
			return err
		}
	}

	registries, err := tx.Registry().ReadAll()
	if err != nil {
		return err
	}
	for i := range registries {
		changed := false
		for _, rap := range registries[i].RegistryAccesses {
			if _, ok := rap.TeamAccessPolicies[teamID]; ok {
				delete(rap.TeamAccessPolicies, teamID)
				changed = true
			}
		}
		if changed {
			if err := tx.Registry().Update(registries[i].ID, &registries[i]); err != nil {
				return err
			}
		}
	}

	return nil
}

// cleanupTeamK8sServiceAccounts removes SA bindings for team members who lose all access to a
// K8s endpoint when the team is deleted. Must be called before team memberships are removed from DB.
func (handler *Handler) cleanupTeamK8sServiceAccounts(teamID portainer.TeamID, memberships []portainer.TeamMembership) {
	if handler.K8sClientFactory == nil {
		return
	}

	var endpoints []portainer.Endpoint
	if err := handler.DataStore.ViewTx(func(tx dataservices.DataStoreTx) error {
		var txErr error
		endpoints, txErr = tx.Endpoint().Endpoints()
		return txErr
	}); err != nil {
		log.Error().Err(err).Msg("failed fetching endpoints for K8s SA cleanup")
		return
	}

	for _, endpoint := range endpoints {
		if _, hasTeamAccess := endpoint.TeamAccessPolicies[teamID]; !hasTeamAccess {
			continue
		}
		if !endpointutils.IsKubernetesEndpoint(&endpoint) {
			continue
		}

		kubecli, err := handler.K8sClientFactory.GetPrivilegedKubeClient(&endpoint)
		if err != nil {
			log.Error().Err(err).Int("endpoint_id", int(endpoint.ID)).Msg("failed getting kube client for team SA cleanup")
			continue
		}

		for _, m := range memberships {
			if _, hasDirect := endpoint.UserAccessPolicies[m.UserID]; hasDirect {
				continue
			}

			userMemberships, err := handler.DataStore.TeamMembership().TeamMembershipsByUserID(m.UserID)
			if err != nil {
				log.Error().Err(err).Int("user_id", int(m.UserID)).Msg("failed fetching user memberships for K8s SA cleanup")
				continue
			}

			hasOtherTeamAccess := false
			for _, um := range userMemberships {
				if um.TeamID == teamID {
					continue
				}
				if _, ok := endpoint.TeamAccessPolicies[um.TeamID]; ok {
					hasOtherTeamAccess = true
					break
				}
			}

			if !hasOtherTeamAccess {
				if err := kubecli.RemoveUserServiceAccountBindings(int(m.UserID)); err != nil {
					log.Error().Err(err).Int("user_id", int(m.UserID)).Int("endpoint_id", int(endpoint.ID)).Msg("failed removing SA bindings for team member")
				}
			}
		}
	}
}

// updateDefaultTeamIfDeleted resets the default team to nil if default team was the deleted team
func (handler *Handler) updateDefaultTeamIfDeleted(teamID portainer.TeamID) error {
	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return errors.Wrap(err, "failed to fetch settings")
	}

	if teamID != settings.OAuthSettings.DefaultTeamID {
		return nil
	}

	settings.OAuthSettings.DefaultTeamID = 0
	err = handler.DataStore.Settings().UpdateSettings(settings)
	return errors.Wrap(err, "failed to update settings")
}
