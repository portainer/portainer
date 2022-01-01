package helm

import (
	"fmt"
	"net/http"
	"net/url"

	"github.com/pkg/errors"
	"github.com/portainer/libhelm/options"
	httperror "github.com/portainer/libhttp/error"
)

// @id HelmRepoSearch
// @summary Search Helm Charts
// @description
// @description **Access policy**: authenticated
// @tags helm
// @param repo query string true "Helm repository URL"
// @security ApiKeyAuth
// @security jwt
// @produce json
// @success 200 {object} string "Success"
// @failure 400 "Bad request"
// @failure 401 "Unauthorized"
// @failure 404 "Not found"
// @failure 500 "Server error"
// @router /templates/helm [get]
func (handler *Handler) helmRepoSearch(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	repo := r.URL.Query().Get("repo")
	if repo == "" {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Bad request", Err: errors.New("missing `repo` query parameter")}
	}

	_, err := url.ParseRequestURI(repo)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Bad request", Err: errors.Wrap(err, fmt.Sprintf("provided URL %q is not valid", repo))}
	}

	searchOpts := options.SearchRepoOptions{
		Repo: repo,
	}

	result, err := handler.helmPackageManager.SearchRepo(searchOpts)
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
