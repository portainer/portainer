package helm

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/portainer/api/exec/helm"
)

// @id HelmRepoSearch
// @summary Search Helm Charts
// @description
// @description **Access policy**: authorized
// @tags helm_chart
// @security jwt
// @accept json
// @produce json
// @success 200 {object} string "Success"
// @failure 401 "Unauthorized"
// @failure 404 "Endpoint or ServiceAccount not found"
// @failure 500 "Server error"
// @router /templates/helm [get]
func (handler *Handler) helmRepoSearch(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to retrieve settings", Err: err}
	}

	searchOpts := helm.SearchRepoOptions{
		Repo: settings.HelmRepositoryURL,
	}

	result, err := handler.HelmPackageManager.SearchRepo(searchOpts)
	if err != nil {
		return &httperror.HandlerError{
			StatusCode: http.StatusInternalServerError,
			Message:    "Search failed",
			Err:        err,
		}
	}

	w.Header().Set("Content-Type", "text/plain")
	w.Write([]byte(result))

	return nil
}
