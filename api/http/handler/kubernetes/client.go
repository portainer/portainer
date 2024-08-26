package kubernetes

import (
	"net/http"

	"github.com/portainer/portainer/api/http/middlewares"
	"github.com/portainer/portainer/api/kubernetes/cli"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
)

// prepareKubeClient is a helper function to prepare a Kubernetes client for the user
// it first fetches getProxyKubeClient to grab the user's admin status and non admin namespaces
// then these two values are parsed to create a privileged client
func (handler *Handler) prepareKubeClient(r *http.Request) (*cli.KubeClient, *httperror.HandlerError) {
	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		return nil, httperror.InternalServerError("an error occurred during the getKubernetesNamespacesCount operation, unable to get a Kubernetes client for the user. Error: ", httpErr)
	}

	endpoint, err := middlewares.FetchEndpoint(r)
	if err != nil {
		return nil, httperror.NotFound("Unable to find an environment on request context", err)
	}

	pcli, err := handler.KubernetesClientFactory.GetPrivilegedKubeClient(endpoint)
	if err != nil {
		return nil, httperror.InternalServerError("an error occurred during the getKubernetesNamespaces operation, unable to get a privileged Kubernetes client for the user. Error: ", err)
	}
	pcli.IsKubeAdmin = cli.IsKubeAdmin
	pcli.NonAdminNamespaces = cli.NonAdminNamespaces

	return pcli, nil
}
