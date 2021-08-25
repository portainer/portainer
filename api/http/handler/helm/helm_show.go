package helm

import (
	"log"
	"net/http"

	"github.com/portainer/libhelm/options"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
)

// @id HelmList
// @summary List Helm Chart(s)
// @description
// @description **Access policy**: authorized
// @tags helm_chart
// @security jwt
// @accept json
// @produce text/plain
// @success 200 {object} string "Success"
// @failure 401 "Unauthorized"
// @failure 404 "Endpoint or ServiceAccount not found"
// @failure 500 "Server error"
// @router /templates/helm/{chart}/{command} [get]
func (handler *Handler) helmShow(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	settings, err := handler.dataStore.Settings().Settings()
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to retrieve settings", Err: err}
	}

	chart, err := request.RetrieveRouteVariableValue(r, "chart")
	if err != nil {
		return &httperror.HandlerError{
			StatusCode: http.StatusInternalServerError,
			Message:    "Missing chart name for show",
			Err:        err,
		}
	}

	cmd, err := request.RetrieveRouteVariableValue(r, "command")
	if err != nil {
		cmd = "all"
		log.Printf("[DEBUG] [internal,helm] [message: command not provided, defaulting to %s]", cmd)
	}

	showOptions := options.ShowOptions{
		OutputFormat: options.ShowOutputFormat(cmd),
		Chart:        chart,
		Repo:         settings.HelmRepositoryURL,
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
