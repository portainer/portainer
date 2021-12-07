package helm

import (
	"fmt"
	"log"
	"net/http"
	"net/url"

	"github.com/pkg/errors"
	"github.com/portainer/libhelm/options"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
)

// @id HelmShow
// @summary Show Helm Chart Information
// @description
// @description **Access policy**: authenticated
// @tags helm
// @param repo query string true "Helm repository URL"
// @param chart query string true "Chart name"
// @param command path string true "chart/values/readme"
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce text/plain
// @success 200 {object} string "Success"
// @failure 401 "Unauthorized"
// @failure 404 "Environment(Endpoint) or ServiceAccount not found"
// @failure 500 "Server error"
// @router /templates/helm/{command} [get]
func (handler *Handler) helmShow(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	repo := r.URL.Query().Get("repo")
	if repo == "" {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Bad request", Err: errors.New("missing `repo` query parameter")}
	}
	_, err := url.ParseRequestURI(repo)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Bad request", Err: errors.Wrap(err, fmt.Sprintf("provided URL %q is not valid", repo))}
	}

	chart := r.URL.Query().Get("chart")
	if chart == "" {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Bad request", Err: errors.New("missing `chart` query parameter")}
	}

	cmd, err := request.RetrieveRouteVariableValue(r, "command")
	if err != nil {
		cmd = "all"
		log.Printf("[DEBUG] [internal,helm] [message: command not provided, defaulting to %s]", cmd)
	}

	showOptions := options.ShowOptions{
		OutputFormat: options.ShowOutputFormat(cmd),
		Chart:        chart,
		Repo:         repo,
	}
	result, err := handler.helmPackageManager.Show(showOptions)
	if err != nil {
		return &httperror.HandlerError{
			StatusCode: http.StatusInternalServerError,
			Message:    "Unable to show chart",
			Err:        err,
		}
	}

	w.Header().Set("Content-Type", "text/plain")
	w.Write(result)

	return nil
}
