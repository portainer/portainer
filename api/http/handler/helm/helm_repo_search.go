package helm

import (
	"net/http"

	"github.com/portainer/libhelm"
	"github.com/portainer/libhelm/options"
	httperror "github.com/portainer/libhttp/error"
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
	repo, httperr := handler.getHelmRepositoryUrl()
	if httperr != nil {
		return httperr
	}

	searchOpts := options.SearchRepoOptions{
		Repo: repo,
	}

	result, err := libhelm.SearchRepo(searchOpts)
	if err != nil {
		return &httperror.HandlerError{
			StatusCode: http.StatusInternalServerError,
			Message:    "Search failed",
			Err:        err,
		}
	}

	w.Header().Set("Content-Type", "text/plain")
	w.Write(result)

	return nil
}
