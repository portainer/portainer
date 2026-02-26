package helm

import (
	"fmt"
	"net/http"
	"net/url"

	"github.com/portainer/portainer/pkg/libhelm/options"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/rs/zerolog/log"

	"github.com/pkg/errors"
)

// @id HelmRepoSearch
// @summary Search Helm Charts
// @description
// @description **Access policy**: authenticated
// @tags helm
// @param repo query string true "Helm repository URL"
// @param chart query string false "Helm chart name"
// @param useCache query string false "If true will use cache to search"
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
		return httperror.BadRequest("Bad request", errors.New("missing `repo` query parameter"))
	}

	chart, _ := request.RetrieveQueryParameter(r, "chart", false)
	// If true will useCache to search, will always add to cache after
	useCache, _ := request.RetrieveBooleanQueryParameter(r, "useCache", false)

	_, err := url.ParseRequestURI(repo)
	if err != nil {
		return httperror.BadRequest("Bad request", errors.Wrap(err, fmt.Sprintf("provided URL %q is not valid", repo)))
	}

	searchOpts := options.SearchRepoOptions{
		Repo:     repo,
		Chart:    chart,
		UseCache: useCache,
	}

	result, err := handler.helmPackageManager.SearchRepo(searchOpts)
	if err != nil {
		return httperror.InternalServerError("Search failed", err)
	}

	w.Header().Set("Content-Type", "text/plain")

	if _, err := w.Write(result); err != nil {
		log.Warn().Err(err).Msg("failed to write helm repo search response")
	}

	return nil
}
