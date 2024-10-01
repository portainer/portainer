package kubernetes

import (
	"net/http"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @id GetKubernetesDashboard
// @summary Get the dashboard summary data
// @description Get the dashboard summary data which is simply a count of a range of different commonly used kubernetes resources.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @produce json
// @param id path int true "Environment (Endpoint) identifier"
// @success 200 {array} kubernetes.K8sDashboard "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /kubernetes/{id}/dashboard [get]
func (handler *Handler) getKubernetesDashboard(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {

	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		return httpErr
	}

	dashboard, err := cli.GetDashboard()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve dashboard data", err)
	}

	return response.JSON(w, dashboard)
}
