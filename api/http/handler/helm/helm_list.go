package helm

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/pkg/libhelm/options"
	_ "github.com/portainer/portainer/pkg/libhelm/release"
)

// @id HelmList
// @summary List Helm Releases
// @description
// @description **Access policy**: authenticated
// @tags helm
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Environment(Endpoint) identifier"
// @param namespace query string false "specify an optional namespace"
// @param filter query string false "specify an optional filter"
// @param selector query string false "specify an optional selector"
// @success 200 {array} release.ReleaseElement "Success"
// @failure 400 "Invalid environment(endpoint) identifier"
// @failure 401 "Unauthorized"
// @failure 404 "Environment(Endpoint) or ServiceAccount not found"
// @failure 500 "Server error"
// @router /endpoints/{id}/kubernetes/helm [get]
func (handler *Handler) helmList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	clusterAccess, httperr := handler.getHelmClusterAccess(r)
	if httperr != nil {
		return httperr
	}

	listOpts := options.ListOptions{
		KubernetesClusterAccess: clusterAccess,
	}

	// optional namespace.  The library defaults to "default"
	namespace, _ := request.RetrieveQueryParameter(r, "namespace", true)
	if namespace != "" {
		listOpts.Namespace = namespace
	}

	// optional filter
	if filter, _ := request.RetrieveQueryParameter(r, "filter", true); filter != "" {
		listOpts.Filter = filter
	}

	// optional selector
	if selector, _ := request.RetrieveQueryParameter(r, "selector", true); selector != "" {
		listOpts.Selector = selector
	}

	releases, err := handler.helmPackageManager.List(listOpts)
	if err != nil {
		return httperror.InternalServerError("Helm returned an error", err)
	}

	return response.JSON(w, releases)
}
