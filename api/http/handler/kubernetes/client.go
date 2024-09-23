package kubernetes

import (
	"net/http"

	"github.com/portainer/portainer/api/http/middlewares"
	"github.com/portainer/portainer/api/kubernetes/cli"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/rs/zerolog/log"
)

// prepareKubeClient is a helper function to prepare a Kubernetes client for the user
// it first fetches getProxyKubeClient to grab the user's admin status and non admin namespaces
// then these two values are parsed to create a privileged client
func (handler *Handler) prepareKubeClient(r *http.Request) (*cli.KubeClient, *httperror.HandlerError) {
	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr.Err).Str("context", "prepareKubeClient").Msg("Unable to get a Kubernetes client for the user.")
		return nil, httperror.InternalServerError("Unable to get a Kubernetes client for the user.", httpErr)
	}

	endpoint, err := middlewares.FetchEndpoint(r)
	if err != nil {
		log.Error().Err(err).Str("context", "prepareKubeClient").Msg("Unable to find the Kubernetes endpoint associated to the request.")
		return nil, httperror.NotFound("Unable to find the Kubernetes endpoint associated to the request.", err)
	}

	pcli, err := handler.KubernetesClientFactory.GetPrivilegedKubeClient(endpoint)
	if err != nil {
		log.Error().Err(err).Str("context", "prepareKubeClient").Msg("Unable to get a privileged Kubernetes client for the user.")
		return nil, httperror.InternalServerError("Unable to get a privileged Kubernetes client for the user.", err)
	}
	pcli.IsKubeAdmin = cli.IsKubeAdmin
	pcli.NonAdminNamespaces = cli.NonAdminNamespaces

	return pcli, nil
}
