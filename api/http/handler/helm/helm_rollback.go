package helm

import (
	"net/http"
	"time"

	"github.com/portainer/portainer/pkg/libhelm/options"
	_ "github.com/portainer/portainer/pkg/libhelm/release"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @id HelmRollback
// @summary Rollback a helm release
// @description Rollback a helm release to a previous revision
// @description **Access policy**: authenticated
// @tags helm
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment(Endpoint) identifier"
// @param release path string true "Helm release name"
// @param namespace query string false "specify an optional namespace"
// @param revision query int false "specify the revision to rollback to (defaults to previous revision if not specified)"
// @param wait query boolean false "wait for resources to be ready (default: false)"
// @param waitForJobs query boolean false "wait for jobs to complete before marking the release as successful (default: false)"
// @param recreate query boolean false "performs pods restart for the resource if applicable (default: true)"
// @param force query boolean false "force resource update through delete/recreate if needed (default: false)"
// @param timeout query int false "time to wait for any individual Kubernetes operation in seconds (default: 300)"
// @success 200 {object} release.Release "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier or release name."
// @failure 500 "Server error occurred while attempting to rollback the release."
// @router /endpoints/{id}/kubernetes/helm/{release}/rollback [post]
func (handler *Handler) helmRollback(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	release, err := request.RetrieveRouteVariableValue(r, "release")
	if err != nil {
		return httperror.BadRequest("No release specified", err)
	}

	clusterAccess, httperr := handler.getHelmClusterAccess(r)
	if httperr != nil {
		return httperr
	}

	// build the rollback options
	rollbackOpts := options.RollbackOptions{
		KubernetesClusterAccess: clusterAccess,
		Name:                    release,
		// Set default values
		Recreate: true,            // Default to recreate pods (restart)
		Timeout:  5 * time.Minute, // Default timeout of 5 minutes
	}

	namespace, _ := request.RetrieveQueryParameter(r, "namespace", true)
	// optional namespace. The library defaults to "default"
	if namespace != "" {
		rollbackOpts.Namespace = namespace
	}

	revision, _ := request.RetrieveNumericQueryParameter(r, "revision", true)
	// optional revision. If not specified, it will rollback to the previous revision
	if revision > 0 {
		rollbackOpts.Version = revision
	}

	// Default for wait is false, only set to true if explicitly requested
	wait, err := request.RetrieveBooleanQueryParameter(r, "wait", true)
	if err == nil {
		rollbackOpts.Wait = wait
	}

	// Default for waitForJobs is false, only set to true if explicitly requested
	waitForJobs, err := request.RetrieveBooleanQueryParameter(r, "waitForJobs", true)
	if err == nil {
		rollbackOpts.WaitForJobs = waitForJobs
	}

	// Default for recreate is true (set above), override if specified
	recreate, err := request.RetrieveBooleanQueryParameter(r, "recreate", true)
	if err == nil {
		rollbackOpts.Recreate = recreate
	}

	// Default for force is false, only set to true if explicitly requested
	force, err := request.RetrieveBooleanQueryParameter(r, "force", true)
	if err == nil {
		rollbackOpts.Force = force
	}

	timeout, _ := request.RetrieveNumericQueryParameter(r, "timeout", true)
	// Override default timeout if specified
	if timeout > 0 {
		rollbackOpts.Timeout = time.Duration(timeout) * time.Second
	}

	releaseInfo, err := handler.helmPackageManager.Rollback(rollbackOpts)
	if err != nil {
		return httperror.InternalServerError("Failed to rollback helm release", err)
	}

	return response.JSON(w, releaseInfo)
}
