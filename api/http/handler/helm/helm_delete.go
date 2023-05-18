package helm

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/pkg/libhelm/options"
)

// @id HelmDelete
// @summary Delete Helm Release
// @description
// @description **Access policy**: authenticated
// @tags helm
// @security ApiKeyAuth
// @security jwt
// @param id path int true "Environment(Endpoint) identifier"
// @param release path string true "The name of the release/application to uninstall"
// @param namespace query string false "An optional namespace"
// @success 204 "Success"
// @failure 400 "Invalid environment(endpoint) id or bad request"
// @failure 401 "Unauthorized"
// @failure 404 "Environment(Endpoint) or ServiceAccount not found"
// @failure 500 "Server error or helm error"
// @router /endpoints/{id}/kubernetes/helm/{release} [delete]
func (handler *Handler) helmDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	release, err := request.RetrieveRouteVariableValue(r, "release")
	if err != nil {
		return httperror.BadRequest("No release specified", err)
	}

	clusterAccess, httperr := handler.getHelmClusterAccess(r)
	if httperr != nil {
		return httperr
	}

	uninstallOpts := options.UninstallOptions{
		Name:                    release,
		KubernetesClusterAccess: clusterAccess,
	}

	q := r.URL.Query()
	if namespace := q.Get("namespace"); namespace != "" {
		uninstallOpts.Namespace = namespace
	}

	err = handler.helmPackageManager.Uninstall(uninstallOpts)
	if err != nil {
		return httperror.InternalServerError("Helm returned an error", err)
	}

	return response.Empty(w)
}
