package kubernetes

import (
	"net/http"

	"github.com/portainer/portainer/api/http/middlewares"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @id getKubernetesClusterServiceAccounts
// @summary Get a list of kubernetes service accounts within the given environment at the cluster level or a given namespace.
// @description Get a list of kubernetes service accounts within the given environment at the cluster level or a given namespace.
// @description **Access policy**: authenticated
// @tags kubernetes
// @security jwt
// @produce json
// @param id path int true "Environment identifier"
// @success 200 {array} models.K8sServiceAccount "Success"
// @router /kubernetes/{id}/serviceaccounts [get]
func (handler *Handler) getKubernetesClusterServiceAccounts(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpoint, err := middlewares.FetchEndpoint(r)
	if err != nil {
		return httperror.NotFound("an error occurred during the GetKubernetesClusterServiceAccounts operation, unable to fetch endpoint. Error: ", err)
	}

	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		return httpErr
	}

	pcli, err := handler.KubernetesClientFactory.GetPrivilegedKubeClient(endpoint)
	if err != nil {
		return httperror.InternalServerError("an error occurred during the GetKubernetesClusterServiceAccounts operation, unable to get privileged kube client for fetching service accounts. Error: ", err)
	}
	pcli.IsKubeAdmin = cli.IsKubeAdmin
	pcli.NonAdminNamespaces = cli.NonAdminNamespaces

	serviceAccounts, err := pcli.GetServiceAccounts("")
	if err != nil {
		return httperror.InternalServerError("an error occurred during the GetKubernetesClusterServiceAccounts operation, unable to fetch service accounts. Error: ", err)
	}

	return response.JSON(w, serviceAccounts)
}
