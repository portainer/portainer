package kubernetes

import (
	"net/http"

	"github.com/portainer/portainer/api/http/middlewares"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @id getAllKubernetesServiceAccounts
// @summary Get a list of kubernetes service accounts within the given environment at the cluster level or a given namespace.
// @description Get a list of kubernetes service accounts within the given environment at the cluster level or a given namespace.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @success 200 {array} models.K8sServiceAccount "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 403 "Unauthorized access or operation not allowed."
// @failure 500 "Server error occurred while attempting to retrieve the list of namespaces."
// @router /kubernetes/{id}/serviceaccounts [get]
func (handler *Handler) getAllKubernetesServiceAccounts(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpoint, err := middlewares.FetchEndpoint(r)
	if err != nil {
		return httperror.NotFound("an error occurred during the GetAllKubernetesServiceAccounts operation, unable to fetch endpoint. Error: ", err)
	}

	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		return httpErr
	}

	pcli, err := handler.KubernetesClientFactory.GetPrivilegedKubeClient(endpoint)
	if err != nil {
		return httperror.InternalServerError("an error occurred during the GetAllKubernetesServiceAccounts operation, unable to get privileged kube client for fetching service accounts. Error: ", err)
	}
	pcli.IsKubeAdmin = cli.IsKubeAdmin
	pcli.NonAdminNamespaces = cli.NonAdminNamespaces

	serviceAccounts, err := pcli.GetServiceAccounts("")
	if err != nil {
		return httperror.InternalServerError("an error occurred during the GetAllKubernetesServiceAccounts operation, unable to fetch service accounts. Error: ", err)
	}

	return response.JSON(w, serviceAccounts)
}
