package teammemberships

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/endpointutils"
	"github.com/portainer/portainer/api/kubernetes/cli"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/rs/zerolog/log"

	"github.com/gorilla/mux"
)

// Handler is the HTTP handler used to handle team membership operations.
type Handler struct {
	*mux.Router
	DataStore        dataservices.DataStore
	K8sClientFactory *cli.ClientFactory
}

// NewHandler creates a handler to manage team membership operations.
func NewHandler(bouncer security.BouncerService) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}

	h.Use(bouncer.TeamLeaderAccess)

	h.Handle("/team_memberships", httperror.LoggerHandler(h.teamMembershipCreate)).Methods(http.MethodPost)
	h.Handle("/team_memberships", httperror.LoggerHandler(h.teamMembershipList)).Methods(http.MethodGet)
	h.Handle("/team_memberships/{id}", httperror.LoggerHandler(h.teamMembershipUpdate)).Methods(http.MethodPut)
	h.Handle("/team_memberships/{id}", httperror.LoggerHandler(h.teamMembershipDelete)).Methods(http.MethodDelete)

	return h
}

func (handler *Handler) updateUserServiceAccounts(membership *portainer.TeamMembership) {
	endpoints, err := handler.DataStore.Endpoint().EndpointsByTeamID(membership.TeamID)
	if err != nil {
		log.Error().Err(err).Msgf("failed fetching environments for team %d", membership.TeamID)
		return
	}

	// Query remaining team memberships after the deletion has already been committed.
	remainingMemberships, err := handler.DataStore.TeamMembership().TeamMembershipsByUserID(membership.UserID)
	if err != nil {
		log.Error().Err(err).Msgf("failed fetching team memberships for user %d", membership.UserID)
		return
	}
	remainingTeamIDs := make([]int, 0, len(remainingMemberships))
	for _, m := range remainingMemberships {
		remainingTeamIDs = append(remainingTeamIDs, int(m.TeamID))
	}

	for _, endpoint := range endpoints {
		if !endpointutils.IsKubernetesEndpoint(&endpoint) {
			continue
		}

		kubecli, err := handler.K8sClientFactory.GetPrivilegedKubeClient(&endpoint)
		if err != nil {
			log.Error().Err(err).Int("environment_id", int(endpoint.ID)).Msg("failed getting kube client for environment")
			continue
		}

		if !userHasEndpointAccess(int(membership.UserID), remainingTeamIDs, &endpoint) {
			if err := kubecli.RemoveUserServiceAccountBindings(int(membership.UserID)); err != nil {
				log.Error().Err(err).Int("environment_id", int(endpoint.ID)).Int("user_id", int(membership.UserID)).Msg("failed removing SA bindings for user")
			}
			continue
		}

		if err := kubecli.SetupUserServiceAccount(int(membership.UserID), remainingTeamIDs, endpoint.Kubernetes.Configuration.RestrictDefaultNamespace); err != nil {
			log.Error().Err(err).Int("environment_id", int(endpoint.ID)).Int("user_id", int(membership.UserID)).Msg("failed setting-up service account for user")
		}
	}
}

func userHasEndpointAccess(userID int, teamIDs []int, endpoint *portainer.Endpoint) bool {
	if _, ok := endpoint.UserAccessPolicies[portainer.UserID(userID)]; ok {
		return true
	}
	for _, teamID := range teamIDs {
		if _, ok := endpoint.TeamAccessPolicies[portainer.TeamID(teamID)]; ok {
			return true
		}
	}
	return false
}
