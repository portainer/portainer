package helm

import (
	"net/http"

	"github.com/portainer/portainer/pkg/libhelm/options"
	_ "github.com/portainer/portainer/pkg/libhelm/release"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @id HelmGet
// @summary Get a helm release
// @description Get details of a helm release by release name
// @description **Access policy**: authenticated
// @tags helm
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment(Endpoint) identifier"
// @param release path string true "Helm release name"
// @param namespace query string false "specify an optional namespace"
// @param showResources query boolean false "show resources of the release"
// @param revision query int false "specify an optional revision"
// @success 200 {object} release.Release "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier."
// @failure 500 "Server error occurred while attempting to retrieve the release."
// @router /endpoints/{id}/kubernetes/helm/{release} [get]
func (handler *Handler) helmGet(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	release, err := request.RetrieveRouteVariableValue(r, "release")
	if err != nil {
		return httperror.BadRequest("No release specified", err)
	}

	clusterAccess, httperr := handler.getHelmClusterAccess(r)
	if httperr != nil {
		return httperr
	}

	// build the get options
	getOpts := options.GetOptions{
		KubernetesClusterAccess: clusterAccess,
		Name:                    release,
	}
	namespace, _ := request.RetrieveQueryParameter(r, "namespace", true)
	// optional namespace.  The library defaults to "default"
	if namespace != "" {
		getOpts.Namespace = namespace
	}
	showResources, _ := request.RetrieveBooleanQueryParameter(r, "showResources", true)
	getOpts.ShowResources = showResources
	revision, _ := request.RetrieveNumericQueryParameter(r, "revision", true)
	// optional revision.  The library defaults to the latest revision if not specified
	if revision > 0 {
		getOpts.Revision = revision
	}

	releases, err := handler.helmPackageManager.Get(getOpts)
	if err != nil {
		return httperror.InternalServerError("Helm returned an error", err)
	}

	return response.JSON(w, releases)
}
