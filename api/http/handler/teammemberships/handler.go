package teammemberships

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/endpointutils"
	"github.com/portainer/portainer/api/kubernetes/cli"
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
	for _, endpoint := range endpoints {
		restrictDefaultNamespace := endpoint.Kubernetes.Configuration.RestrictDefaultNamespace
		// update kubernenets service accounts if the team is associated with a kubernetes environment
		if endpointutils.IsKubernetesEndpoint(&endpoint) {
			kubecli, err := handler.K8sClientFactory.GetKubeClient(&endpoint)
			if err != nil {
				log.Error().Err(err).Msgf("failed getting kube client for environment %d", endpoint.ID)
				continue
			}
			teamIDs := []int{int(membership.TeamID)}
			err = kubecli.SetupUserServiceAccount(int(membership.UserID), teamIDs, restrictDefaultNamespace)
			if err != nil {
				log.Error().Err(err).Msgf("failed setting-up service account for user %d", membership.UserID)
			}
		}
	}
}
